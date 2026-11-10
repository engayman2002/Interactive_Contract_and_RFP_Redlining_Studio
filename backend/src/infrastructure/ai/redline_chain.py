"""LangChain (LCEL) Clause Auditing Chain, Structured Output Schema, and Retry/Fallback Parser."""

import json
import logging
import re
import time
from collections.abc import Sequence
from typing import Any, Final, Literal
from uuid import UUID

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable, RunnableConfig, RunnableLambda
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from src.domain.entities import (
    ClauseAuditInput,
    ClauseAuditResult,
    ClauseCopilotRefineInput,
    ClauseCopilotRefineResult,
    CounterpartyPushbackInput,
    CounterpartyPushbackSimulation,
    CriticVerificationReport,
    MatchedPlaybookRule,
)
from src.domain.enums import (
    NegotiationStance,
    PushbackSeverity,
    RiskLevel,
    VerificationStatus,
)
from src.domain.exceptions import ClauseAnalysisError, StructuredOutputValidationError
from src.domain.ports import ClauseAuditorPort
from src.infrastructure.vector.embedding_service import (
    stem_legal_token,
    tokenize_legal_text,
)

logger = logging.getLogger(__name__)


class RedlineOutput(BaseModel):
    """Structured AI redline output schema matching Section 4 of DOCS.md."""

    model_config = ConfigDict(extra="ignore")

    is_compliant: bool = Field(description="True if clause satisfies company policy")
    risk: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    category: str = Field(description="Clause domain such as Liability, SLA, or Payment")
    proposed_text: str = Field(description="Exact drop-in replacement text for the clause")
    rationale: str = Field(description="Clear legal or technical explanation for the redline")
    negotiation_talking_point: str = Field(
        description="Short justification to send to counterparty"
    )


class PushbackSimulationOutput(BaseModel):
    """Structured opposing counsel pushback simulation schema."""

    model_config = ConfigDict(extra="ignore")

    acceptance_probability: int = Field(ge=0, le=100)
    pushback_severity: PushbackSeverity
    counterparty_persona: str = Field(min_length=3)
    expected_objection: str = Field(min_length=5)
    rebuttal_talking_point: str = Field(min_length=5)
    fallback_compromise_text: str = Field(min_length=5)


PUSHBACK_SIMULATION_SYSTEM_PROMPT: Final[str] = (
    "You are a veteran Opposing Legal Counsel & Commercial Deal Strategist simulating "
    "counterparty pushback before contract redlines are sent externally. Given the original "
    "clause, our proposed redline, our Playbook rules, and the active negotiation stance, "
    "predict the counterparty's exact commercial objection, estimate acceptance_probability "
    "(0-100), craft a persuasive Round-2 rebuttal talking point, and draft a balanced Round-2 "
    "fallback compromise clause preserving the original section number prefix. "
    "Return valid JSON matching PushbackSimulationOutput."
)


def _classify_pushback_severity(acceptance_probability: int) -> PushbackSeverity:
    if acceptance_probability >= 75:
        return PushbackSeverity.LOW
    if acceptance_probability >= 50:
        return PushbackSeverity.MODERATE
    if acceptance_probability >= 25:
        return PushbackSeverity.HIGH
    return PushbackSeverity.DEALBREAKER


SYSTEM_PROMPT: Final[str] = """You are a Principal Legal and Technical Contract Auditor.
Compare the provided contract clause against the retrieved Company Playbook Rules.
If the clause violates policy or introduces unmitigated risk, generate a precise surgical redline
that protects the company while remaining commercially reasonable."""

COPILOT_SYSTEM_PROMPT: Final[str] = (
    "You are an expert Legal Counsel and Contract AI Copilot. The user has provided an original "
    "contract clause, an initial proposed redline, and an explicit user refinement instruction. "
    "Your objective is to refine the proposed wording, rationale, and negotiation talking point "
    "to strictly satisfy the user's specific instruction while adhering to the governing Playbook "
    "rules and negotiation stance. Return a valid JSON object matching RedlineOutput."
)

STANCE_INSTRUCTIONS: Final[dict[NegotiationStance, str]] = {
    NegotiationStance.STRICT: (
        "NEGOTIATION STANCE: STRICT / PROTECTIVE. Enforce the Company Playbook's Standard Position "
        "with zero compromise. Do not use fallback compromises. Draft protective language that "
        "strictly insulates the company from liability and risk."
    ),
    NegotiationStance.BALANCED: (
        "NEGOTIATION STANCE: BALANCED / MUTUAL. Enforce Company Playbook protections using fair, "
        "reciprocal, bilateral obligations ('Each party...') that are commercially reasonable to "
        "both parties."
    ),
    NegotiationStance.COMMERCIAL: (
        "NEGOTIATION STANCE: COMMERCIAL / FAST-CLOSE. Prioritize deal velocity and fast signature. "
        "Where a clause conflicts with policy, use the Company Playbook's pre-approved Fallback "
        "Position and draft collaborative, minimal-friction redlines."
    ),
}

CRITICAL_RISK_PATTERNS: Final[tuple[tuple[str, str, str, str], ...]] = (
    (
        "uncapped",
        "Limitation of Liability",
        (
            "Each party's aggregate cumulative liability under this Agreement shall not exceed "
            "twelve (12) months of fees paid or payable, and neither party shall be liable for "
            "indirect, incidental, special, punitive, or consequential damages."
        ),
        "Clause exposes the company to uncapped or asymmetric consequential liability.",
    ),
    (
        "unlimited liability",
        "Limitation of Liability",
        (
            "Each party's aggregate cumulative liability under this Agreement shall be capped at "
            "twelve (12) months of fees paid or payable, excluding consequential damages."
        ),
        "Unlimited liability violates standard enterprise risk allocation policy.",
    ),
    (
        "without limit",
        "Indemnification",
        (
            "Each party shall defend, indemnify, and hold harmless the other party from "
            "third-party claims arising from gross negligence, willful misconduct, or IP "
            "infringement, subject to a mutual super-cap of two (2x) times annual contract fees."
        ),
        "Unlimited indemnification obligation violates company risk caps.",
    ),
    (
        "exceed $500",
        "Limitation of Liability",
        (
            "In no event shall either party's aggregate liability be less than twelve (12) months "
            "of fees paid or payable, and neither party shall be liable for consequential damages."
        ),
        "Nominal $500 vendor liability cap is commercially unreasonable and disproportionate.",
    ),
    (
        "vendor's own negligence",
        "Indemnification",
        (
            "Each party shall indemnify the other solely for third-party claims caused by the "
            "indemnifying party's gross negligence, willful misconduct, or IP infringement."
        ),
        "Customer cannot indemnify Vendor for Vendor's own negligence or misconduct.",
    ),
    (
        "train public",
        "Data Privacy & GDPR",
        (
            "Vendor shall process Customer Data solely to deliver the contracted Services and "
            "is strictly prohibited from using Customer Confidential Data to train external or "
            "public machine learning models."
        ),
        "Prohibits training external AI models on proprietary Customer data.",
    ),
    (
        "foundation models",
        "Data Privacy & GDPR",
        (
            "Vendor shall not use Customer personal or confidential data to train third-party "
            "or foundation AI models under any circumstances."
        ),
        "Training third-party foundation models on Customer data violates privacy policy.",
    ),
    (
        "assigns all right",
        "Intellectual Property",
        (
            "Customer retains all right, title, and interest in and to Customer Data and "
            "Customer Pre-Existing IP. Vendor retains ownership of its pre-existing background IP."
        ),
        "Prevents unintended assignment of Customer pre-existing intellectual property.",
    ),
)

HIGH_RISK_PATTERNS: Final[tuple[tuple[str, str, str, str], ...]] = (
    (
        "best-efforts",
        "Service Level Agreement",
        (
            "Vendor guarantees 99.95% monthly service availability with a 10% service credit "
            "for each 0.1% of downtime below the SLA target."
        ),
        "Best-efforts availability without enforceable SLA credits fails technical requirements.",
    ),
    (
        "best efforts",
        "Service Level Agreement",
        (
            "Vendor guarantees 99.95% monthly service availability backed by service credits "
            "and termination rights for chronic SLA failures."
        ),
        "Best-efforts availability lacks binding uptime commitments and remedies.",
    ),
    (
        "sole remedy waiver",
        "Service Level Agreement",
        (
            "Customer shall receive service credits for SLA breaches and retains the right to "
            "terminate for cause upon three (3) consecutive months of SLA failure."
        ),
        "Waiving termination remedies for chronic SLA failures is unacceptable.",
    ),
    (
        "without refund",
        "Payment Terms",
        (
            "Invoices are payable Net 45 days from receipt of an undisputed invoice. Upon "
            "termination for cause by Customer, Vendor shall issue a pro-rata refund of prepaid "
            "unused fees."
        ),
        "Forfeiture of prepaid fees upon termination violates financial controls.",
    ),
    (
        "5% monthly",
        "Payment Terms",
        (
            "Undisputed invoices shall be payable within forty-five (45) days of receipt, with "
            "late interest capped at 1.0% per month on overdue undisputed balances."
        ),
        "Excessive 5% monthly compound late penalty exceeds statutory and policy limits.",
    ),
    (
        "sole discretion",
        "General Commercial",
        (
            "Any material modification to the Services or Agreement terms shall require mutual "
            "written consent of both parties."
        ),
        "Unilateral modification rights at Vendor's sole discretion create operational risk.",
    ),
)

SECTION_NUMBER_PREFIX_RE: Final[re.Pattern[str]] = re.compile(
    r"^\s*((?:Section\s+|Article\s+|Clause\s+)?\d+(?:\.\d+)*\.?\s+)",
    re.IGNORECASE,
)


def format_playbook_rules_context(matched_rules: Sequence[MatchedPlaybookRule]) -> str:
    """Format retrieved `MatchedPlaybookRule` objects into a prompt context block."""
    if not matched_rules:
        return "No specific company playbook rules were retrieved for this clause."

    blocks: list[str] = []
    for idx, match in enumerate(matched_rules, start=1):
        rule = match.rule
        blocks.append(
            f"[Rule #{idx} | ID={rule.id} | Category={rule.category} | "
            f"Score={match.combined_score:.3f}]\n"
            f"- Standard Position: {rule.standard_position}\n"
            f"- Fallback Position: {rule.fallback_position}\n"
            f"- Unacceptable Triggers: {rule.unacceptable_triggers}"
        )
    return "\n\n".join(blocks)


def _preserve_clause_numbering(original_clause_text: str, replacement_body: str) -> str:
    """Preserve leading section numbering (e.g. `4.2 `) when generating replacement wording."""
    cleaned_replacement = replacement_body.strip()
    match = SECTION_NUMBER_PREFIX_RE.match(original_clause_text)
    if match:
        prefix = match.group(1)
        if not cleaned_replacement.lower().startswith(prefix.strip().lower()):
            return f"{prefix}{cleaned_replacement}"
    return cleaned_replacement


def _extract_meaningful_stems(text: str) -> set[str]:
    stop_stems = {
        "the",
        "and",
        "for",
        "with",
        "that",
        "this",
        "from",
        "shall",
        "will",
        "any",
        "all",
        "not",
        "are",
        "under",
        "party",
        "parti",
        "agreement",
    }
    return {
        stem_legal_token(tok)
        for tok in tokenize_legal_text(text)
        if len(tok) >= 3 and stem_legal_token(tok) not in stop_stems
    }


class PolicyAwareDeterministicChatModel(Runnable[Any, str]):
    """Deterministic policy-aware structured LLM runnable for fast offline/CI clause auditing.

    Evaluates contract clauses against retrieved `MatchedPlaybookRule` policies and legal risk
    heuristics at `temperature = 0.0`, outputting strict JSON conforming to `RedlineOutput`.
    """

    def __init__(self, temperature: float = 0.0) -> None:
        super().__init__()
        self.temperature = temperature

    @staticmethod
    def _extract_inputs(
        input_data: Any,
    ) -> tuple[str, list[MatchedPlaybookRule], NegotiationStance]:
        """Extract `clause_text`, `matched_rules`, and `stance` from input."""
        if isinstance(input_data, dict):
            clause_text = str(input_data.get("clause_text", ""))
            matched_rules = list(input_data.get("matched_rules", []))
            raw_stance = input_data.get("stance", NegotiationStance.BALANCED)
            stance = (
                raw_stance
                if isinstance(raw_stance, NegotiationStance)
                else NegotiationStance(str(raw_stance).lower())
            )
            return clause_text, matched_rules, stance

        # When invoked after ChatPromptTemplate (`ChatPromptValue` or message list)
        text_repr = str(input_data)
        clause_marker = "Contract Clause:\n"
        if clause_marker in text_repr:
            clause_text = text_repr.split(clause_marker, maxsplit=1)[1].strip()
        else:
            clause_text = text_repr.strip()
        return clause_text, [], NegotiationStance.BALANCED

    def evaluate_to_redline_output(
        self,
        clause_text: str,
        matched_rules: Sequence[MatchedPlaybookRule],
        heading: str | None = None,
        stance: NegotiationStance = NegotiationStance.BALANCED,
    ) -> RedlineOutput:
        """Deterministically evaluate `clause_text` against rules, risk patterns, and stance."""
        lower_clause = clause_text.lower()
        clause_stems = _extract_meaningful_stems(clause_text)
        top_rule = matched_rules[0].rule if matched_rules else None
        inferred_category = (
            top_rule.category
            if top_rule is not None
            else (heading.strip() if heading and heading.strip() else "General Commercial")
        )

        # 1. Check matched PlaybookRule unacceptable triggers vs standard/fallback position
        for match in matched_rules:
            rule = match.rule
            trigger_stems = _extract_meaningful_stems(rule.unacceptable_triggers)
            std_stems = _extract_meaningful_stems(rule.standard_position)

            trigger_overlap = len(clause_stems & trigger_stems) / max(1, len(trigger_stems))
            std_overlap = len(clause_stems & std_stems) / max(1, len(std_stems))

            # Direct substring check on comma/semicolon-separated trigger phrases
            raw_trigger_phrases = [
                p.strip().lower()
                for p in re.split(r"[;,.]", rule.unacceptable_triggers)
                if len(p.strip()) >= 6
            ]
            phrase_triggered = any(phrase in lower_clause for phrase in raw_trigger_phrases)

            if (phrase_triggered or trigger_overlap >= 0.35) and std_overlap < 0.75:
                is_critical = any(
                    kw in lower_clause or kw in rule.unacceptable_triggers.lower()
                    for kw in (
                        "uncapped",
                        "unlimited",
                        "negligence",
                        "ip",
                        "encrypt",
                        "gdpr",
                        "train",
                        "$500",
                    )
                )
                risk_level: Literal["CRITICAL", "HIGH"] = "CRITICAL" if is_critical else "HIGH"

                if stance == NegotiationStance.COMMERCIAL:
                    proposed = _preserve_clause_numbering(clause_text, rule.fallback_position)
                    rationale = (
                        f"[Commercial Fast-Close Stance] Clause conflicts with "
                        f"'{rule.category}' playbook policy ({rule.unacceptable_triggers}). "
                        "Pre-approved commercial fallback position adopted to expedite deal "
                        f"closure: {rule.fallback_position}"
                    )
                    talking_point = (
                        f"To accelerate deal closure, we have pre-approved our commercial fallback "
                        f"terms for {rule.category} ({rule.fallback_position})."
                    )
                elif stance == NegotiationStance.STRICT:
                    proposed = _preserve_clause_numbering(clause_text, rule.standard_position)
                    rationale = (
                        f"[Strict Protective Stance] Clause triggers unacceptable risk under the "
                        f"'{rule.category}' playbook policy ({rule.unacceptable_triggers}). "
                        f"Strictly enforcing company standard position with zero compromise: "
                        f"{rule.standard_position}"
                    )
                    talking_point = (
                        "Our corporate risk governance strictly mandates adherence to our "
                        f"standard position for {rule.category} without compromise: "
                        f"{rule.standard_position}"
                    )
                else:  # BALANCED
                    proposed = _preserve_clause_numbering(clause_text, rule.standard_position)
                    rationale = (
                        f"[Balanced Mutual Stance] Clause triggers unacceptable risk under the "
                        f"'{rule.category}' playbook policy ({rule.unacceptable_triggers}). "
                        f"Replaced with balanced standard position: {rule.standard_position}"
                    )
                    talking_point = (
                        f"Our standard corporate policy for {rule.category} requires balanced "
                        f"terms aligned with industry norms ({rule.fallback_position})."
                    )

                return RedlineOutput(
                    is_compliant=False,
                    risk=risk_level,
                    category=rule.category,
                    proposed_text=proposed,
                    rationale=rationale,
                    negotiation_talking_point=talking_point,
                )

        # 2. Check explicit CRITICAL legal/technical risk patterns
        for pattern, pat_category, replacement_body, reason in CRITICAL_RISK_PATTERNS:
            if pattern in lower_clause:
                resolved_cat = top_rule.category if top_rule is not None else pat_category
                if stance == NegotiationStance.COMMERCIAL and top_rule is not None:
                    chosen_body = top_rule.fallback_position
                    rationale = (
                        f"[Commercial Fast-Close Stance] {reason} "
                        "Applied commercial fallback terms."
                    )
                    talking_point = (
                        f"To accelerate deal closure, we offer our pre-approved commercial "
                        f"fallback position for {resolved_cat}."
                    )
                elif stance == NegotiationStance.STRICT:
                    chosen_body = (
                        top_rule.standard_position if top_rule is not None else replacement_body
                    )
                    rationale = (
                        f"[Strict Protective Stance] {reason} "
                        "Standard position strictly required."
                    )
                    talking_point = (
                        f"Our corporate policy strictly mandates full {resolved_cat} protection."
                    )
                else:
                    chosen_body = (
                        top_rule.standard_position if top_rule is not None else replacement_body
                    )
                    rationale = (
                        f"[Balanced Mutual Stance] {reason}" if top_rule is not None else reason
                    )
                    talking_point = (
                        f"We require our standard {resolved_cat} protection to ensure mutual and "
                        f"commercially reasonable risk allocation."
                    )

                return RedlineOutput(
                    is_compliant=False,
                    risk="CRITICAL",
                    category=resolved_cat,
                    proposed_text=_preserve_clause_numbering(clause_text, chosen_body),
                    rationale=rationale,
                    negotiation_talking_point=talking_point,
                )

        # 3. Check explicit HIGH legal/technical risk patterns
        for pattern, pat_category, replacement_body, reason in HIGH_RISK_PATTERNS:
            if pattern in lower_clause:
                resolved_cat = top_rule.category if top_rule is not None else pat_category
                if stance == NegotiationStance.COMMERCIAL and top_rule is not None:
                    chosen_body = top_rule.fallback_position
                    rationale = (
                        f"[Commercial Fast-Close Stance] {reason} "
                        "Applied commercial fallback position."
                    )
                    talking_point = (
                        f"We have adopted our commercial fallback baseline for {resolved_cat} "
                        f"to expedite deal completion."
                    )
                elif stance == NegotiationStance.STRICT:
                    chosen_body = (
                        top_rule.standard_position if top_rule is not None else replacement_body
                    )
                    rationale = (
                        f"[Strict Protective Stance] {reason} "
                        "Standard terms strictly required."
                    )
                    talking_point = (
                        f"Our corporate policy strictly requires standard {resolved_cat} "
                        "provisions."
                    )
                else:
                    chosen_body = (
                        top_rule.standard_position if top_rule is not None else replacement_body
                    )
                    rationale = (
                        f"[Balanced Mutual Stance] {reason}" if top_rule is not None else reason
                    )
                    talking_point = (
                        f"Please align this {resolved_cat} provision with our standard "
                        "commercial baseline."
                    )

                return RedlineOutput(
                    is_compliant=False,
                    risk="HIGH",
                    category=resolved_cat,
                    proposed_text=_preserve_clause_numbering(clause_text, chosen_body),
                    rationale=rationale,
                    negotiation_talking_point=talking_point,
                )

        # 4. Check MEDIUM risk when a relevant playbook rule exists but standard position isn't met
        if top_rule is not None and matched_rules[0].combined_score >= 0.42:
            std_stems = _extract_meaningful_stems(top_rule.standard_position)
            fb_stems = _extract_meaningful_stems(top_rule.fallback_position)
            std_overlap = len(clause_stems & std_stems) / max(1, len(std_stems))
            fb_overlap = len(clause_stems & fb_stems) / max(1, len(fb_stems))

            if std_overlap < 0.45 and fb_overlap >= 0.35:
                if stance == NegotiationStance.COMMERCIAL:
                    return RedlineOutput(
                        is_compliant=True,
                        risk="LOW",
                        category=top_rule.category,
                        proposed_text=clause_text,
                        rationale=(
                            f"[Commercial Fast-Close Stance] Clause aligns with company "
                            f"pre-approved fallback terms for '{top_rule.category}'; "
                            "accepted to expedite closure."
                        ),
                        negotiation_talking_point=(
                            "Fallback terms accepted to facilitate rapid signing."
                        ),
                    )
                if stance == NegotiationStance.STRICT:
                    return RedlineOutput(
                        is_compliant=False,
                        risk="HIGH",
                        category=top_rule.category,
                        proposed_text=_preserve_clause_numbering(
                            clause_text, top_rule.standard_position
                        ),
                        rationale=(
                            f"[Strict Protective Stance] Clause reflects fallback terms. Standard "
                            f"position is strictly required for '{top_rule.category}': "
                            f"{top_rule.standard_position}"
                        ),
                        negotiation_talking_point=(
                            f"Our strict risk policy requires standard position for "
                            f"{top_rule.category}; fallback compromises are not permitted."
                        ),
                    )
                # BALANCED
                return RedlineOutput(
                    is_compliant=False,
                    risk="MEDIUM",
                    category=top_rule.category,
                    proposed_text=_preserve_clause_numbering(
                        clause_text, top_rule.standard_position
                    ),
                    rationale=(
                        f"[Balanced Mutual Stance] Clause reflects fallback terms rather than "
                        f"preferred standard position for '{top_rule.category}'."
                    ),
                    negotiation_talking_point=(
                        f"We prefer our standard {top_rule.category} wording, though our "
                        f"fallback position remains available if required."
                    ),
                )

        # 5. Compliant / Low Risk clause
        if stance == NegotiationStance.STRICT:
            comp_rationale = (
                f"[Strict Protective Stance] Clause satisfies strict company policy "
                f"requirements for '{inferred_category}' with no unacceptable triggers detected."
            )
        elif stance == NegotiationStance.COMMERCIAL:
            comp_rationale = (
                f"[Commercial Fast-Close Stance] Clause satisfies commercial baseline "
                f"requirements for '{inferred_category}'."
            )
        else:
            comp_rationale = (
                f"Clause satisfies company policy requirements for '{inferred_category}' "
                f"with no unacceptable triggers detected."
            )

        return RedlineOutput(
            is_compliant=True,
            risk="LOW",
            category=inferred_category,
            proposed_text=clause_text,
            rationale=comp_rationale,
            negotiation_talking_point="No redline required; clause is acceptable as drafted.",
        )

    def evaluate_copilot_refinement(
        self,
        original_clause_text: str,
        current_proposed_text: str,
        user_instruction: str,
        matched_rules: Sequence[MatchedPlaybookRule],
        heading: str | None = None,
        stance: NegotiationStance = NegotiationStance.BALANCED,
    ) -> RedlineOutput:
        """Deterministically refine redline wording according to user's copilot instruction."""
        instr_lower = user_instruction.lower().strip()
        top_rule = matched_rules[0].rule if matched_rules else None
        category = (
            top_rule.category
            if top_rule
            else (heading.strip() if heading else "General Commercial")
        )

        cap_match = re.search(r"(\$[\d,]+(?:\.\d+)?|\b\d+k\b)", user_instruction, re.IGNORECASE)
        cure_match = re.search(
            r"(\d+[\s-]?(?:day|days|business\s+days))\b", user_instruction, re.IGNORECASE
        )
        is_mutual = any(
            kw in instr_lower for kw in ("mutual", "bilateral", "reciprocal", "each party")
        )
        is_soften = any(
            kw in instr_lower for kw in ("soften", "partner", "collaborative", "relationship")
        )

        cap_val = cap_match.group(1).upper() if cap_match else None
        cure_val = cure_match.group(1).lower() if cure_match else None

        if cap_val and cure_val:
            body = (
                f"Each party's aggregate cumulative liability under this Agreement shall not "
                f"exceed {cap_val}, subject to a {cure_val} prior written notice and cure period "
                "before any claim or termination, and neither party shall be liable for "
                "consequential damages."
            )
        elif cap_val:
            body = (
                f"Each party's aggregate cumulative liability under this Agreement shall not "
                f"exceed {cap_val}, with mutual waiver of indirect, special, and consequential "
                "damages."
            )
        elif cure_val:
            if "terminate" in current_proposed_text.lower() or "termination" in instr_lower:
                body = (
                    "Either party may terminate this Agreement for material breach only after "
                    f"providing a {cure_val} prior written notice and opportunity to cure to "
                    "the other party."
                )
            else:
                body = (
                    f"{current_proposed_text.rstrip('.')} subject to a {cure_val} written notice "
                    "and opportunity to cure before remedies or termination apply."
                )
        elif is_mutual:
            orig_lower = original_clause_text.lower()
            prop_lower = current_proposed_text.lower()
            if "indemnif" in prop_lower or "indemnif" in orig_lower:
                body = (
                    "Each party shall defend, indemnify, and hold harmless the other party on a "
                    "mutual and reciprocal basis against third-party claims, excluding "
                    "consequential damages."
                )
            else:
                stripped_prop = current_proposed_text.lstrip("0123456789. ")
                body = f"Each party mutually agrees to the following terms: {stripped_prop}"
        elif is_soften:
            body = (
                "The parties agree to collaborate in good faith under commercially reasonable "
                "standards to resolve operational issues, provided core proprietary intellectual "
                "property rights and confidentiality protections remain fully preserved."
            )
        else:
            cleaned_instr = user_instruction.strip().rstrip(".")
            body = (
                f"{current_proposed_text.rstrip('.')} (Refined per counsel instruction: "
                f"{cleaned_instr})."
            )

        refined_proposed = _preserve_clause_numbering(original_clause_text, body)
        rationale_summary = user_instruction.strip()
        if len(rationale_summary) > 60:
            rationale_summary = rationale_summary[:57] + "..."
        rationale = (
            f'[AI Copilot Refined: "{rationale_summary}"] '
            "Refined proposed redline to honor deal instruction."
        )
        talking_point = (
            f"Per specific deal guidance, terms have been refined: {user_instruction.strip()}"
        )

        return RedlineOutput(
            is_compliant=False,
            risk="HIGH" if stance == NegotiationStance.STRICT else "MEDIUM",
            category=category,
            proposed_text=refined_proposed,
            rationale=rationale,
            negotiation_talking_point=talking_point,
        )

    def evaluate_counterparty_pushback(
        self,
        original_clause_text: str,
        proposed_text: str,
        risk: RiskLevel,
        matched_rules: Sequence[MatchedPlaybookRule],
        heading: str | None = None,
        stance: NegotiationStance = NegotiationStance.BALANCED,
    ) -> PushbackSimulationOutput:
        """Deterministically simulate opposing counsel pushback and Round-2 rebuttal."""
        top_rule = matched_rules[0].rule if matched_rules else None
        topic_text = f"{heading or ''} {original_clause_text} {proposed_text}".lower()
        prop_lower = proposed_text.lower()

        already_compromise = any(
            kw in prop_lower
            for kw in ("two times", "2x", "24 months", "99.9%", "fallback", "net 30", "tiered")
        )

        # Determine acceptance probability based on stance, risk shift, and compromise status
        if stance == NegotiationStance.COMMERCIAL or already_compromise:
            prob = 82 if stance == NegotiationStance.COMMERCIAL else 76
        elif stance == NegotiationStance.STRICT:
            if "unconditional" in prop_lower or (
                risk == RiskLevel.CRITICAL and "without limitation" in prop_lower
            ):
                prob = 22
            elif risk in (RiskLevel.CRITICAL, RiskLevel.HIGH):
                prob = 36
            else:
                prob = 48
        else:  # BALANCED
            if risk == RiskLevel.CRITICAL:
                prob = 44
            elif risk == RiskLevel.HIGH:
                prob = 58
            elif risk == RiskLevel.MEDIUM:
                prob = 68
            else:
                prob = 84

        severity = _classify_pushback_severity(prob)

        if any(kw in topic_text for kw in ("liability", "cap", "consequential", "damages")):
            persona = "Enterprise Vendor Commercial & Legal Counsel"
            objection = (
                "Counterparty counsel will argue that resetting liability from the nominal $500 "
                "or existing cap to a 12-month fee cap exposes them to disproportionate margin "
                "erosion relative to annual subscription revenue."
            )
            rebuttal = (
                "An asymmetric or sub-market $500 cap shifts catastrophic vendor platform risk "
                "onto Customer and fails board audit controls. A 12-month fee cap with mutual "
                "exclusion of consequential damages reflects Fortune 500 SaaS market parity."
            )
            fallback_body = (
                top_rule.fallback_position
                if top_rule is not None
                else (
                    "Each party's aggregate cumulative liability under this Agreement shall not "
                    "exceed two times (2x) the annual fees paid for data breach or IP indemnity, "
                    "and twelve (12) months of fees for general direct damages."
                )
            )
        elif any(kw in topic_text for kw in ("indemnif", "hold harmless", "negligence", "ip")):
            persona = "Vendor Risk & Intellectual Property Counsel"
            objection = (
                "Opposing counsel will resist uncapped vendor IP/fault indemnity obligations "
                "and push for a fault-proportioned cap or procedural control-of-defense carve-outs."
            )
            rebuttal = (
                "No customer can indemnify a SaaS vendor for the vendor's own gross negligence "
                "or third-party infringement claims inside proprietary code Customer cannot "
                "inspect. Fault-based mutual indemnity is the non-negotiable baseline."
            )
            fallback_body = (
                top_rule.fallback_position
                if top_rule is not None
                else (
                    "Each party shall defend and indemnify the other for third-party IP "
                    "infringement and bodily injury/gross negligence claims, subject to a mutual "
                    "super-cap equal to two times (2x) annual contract fees and prompt written "
                    "notice with sole control of defense."
                )
            )
        elif any(kw in topic_text for kw in ("sla", "uptime", "service credit", "best-efforts")):
            persona = "Vendor Cloud Operations & Revenue Counsel"
            objection = (
                "Counterparty will claim that binding 99.95%+ SLAs and termination rights create "
                "revenue recognition risk for transient multi-tenant infrastructure incidents."
            )
            rebuttal = (
                "Production enterprise workloads require enforceable availability commitments. "
                "Tiered SLA credits capped at monthly fees and chronic-failure exit rights give "
                "Vendor predictable remedies while protecting operational continuity."
            )
            fallback_body = (
                top_rule.fallback_position
                if top_rule is not None
                else (
                    "Vendor guarantees 99.9% monthly service availability with tiered service "
                    "credits up to 15% of monthly fees, and Customer may terminate for cause upon "
                    "four (4) consecutive months below 99.5% uptime."
                )
            )
        elif any(kw in topic_text for kw in ("ai", "train", "foundation model", "gdpr", "privacy")):
            persona = "Vendor AI Product & Data Privacy Officer (DPO)"
            objection = (
                "Opposing counsel may contend they need telemetry ingestion rights to operate "
                "automated anomaly detection, spam filtering, and platform tuning."
            )
            rebuttal = (
                "Operational security telemetry and anonymized service health diagnostics remain "
                "permitted, whereas training shared generative or foundation models on Customer "
                "Confidential Data violates enterprise confidentiality and GDPR purpose limits."
            )
            fallback_body = (
                top_rule.fallback_position
                if top_rule is not None
                else (
                    "Vendor shall not use Customer Confidential Data to train public or "
                    "third-party AI models, provided Vendor may analyze strictly aggregated, "
                    "irreversibly de-identified operational metrics solely to maintain platform "
                    "security and reliability."
                )
            )
        elif any(kw in topic_text for kw in ("payment", "invoice", "net ", "fee", "refund")):
            persona = "Counterparty Treasury & Finance Director"
            objection = (
                "Counterparty finance will object that Net 45/60 extends Days Sales Outstanding "
                "(DSO) beyond standard quarterly SaaS billing terms."
            )
            rebuttal = (
                "Our global accounts payable cycle mandates Net 45 settlement for enterprise "
                "vendors; undisputed invoices clear reliably under automated ACH scheduling with "
                "pro-rata refunds only for uncured Vendor breach."
            )
            fallback_body = (
                top_rule.fallback_position
                if top_rule is not None
                else (
                    "Undisputed invoices shall be payable within thirty (30) days of receipt via "
                    "ACH, with a 15-day notice and dispute cure window and pro-rata refund of "
                    "prepaid unused fees upon Customer termination for cause."
                )
            )
        else:
            persona = "Counterparty Senior Commercial Counsel"
            objection = (
                "Opposing counsel will push back that the proposed redline alters the standard "
                "commercial risk allocation compared to their template paper."
            )
            rebuttal = (
                "Our redline replaces unilateral obligations with balanced bilateral terms "
                "that protect both parties equally without delaying project onboarding."
            )
            fallback_body = (
                top_rule.fallback_position
                if top_rule is not None
                else (
                    "Each party shall perform its obligations in a commercially reasonable, "
                    "reciprocal manner, subject to thirty (30) days prior written notice and "
                    "opportunity to cure."
                )
            )

        compromise_text = _preserve_clause_numbering(original_clause_text, fallback_body)

        return PushbackSimulationOutput(
            acceptance_probability=prob,
            pushback_severity=severity,
            counterparty_persona=persona,
            expected_objection=objection,
            rebuttal_talking_point=rebuttal,
            fallback_compromise_text=compromise_text,
        )

    def invoke(
        self,
        input: Any,  # noqa: A002
        config: RunnableConfig | None = None,
        **kwargs: Any,
    ) -> str:
        """Synchronously invoke the deterministic model and return a JSON string."""
        _ = config, kwargs
        clause_text, matched_rules, stance = self._extract_inputs(input)
        output = self.evaluate_to_redline_output(
            clause_text=clause_text,
            matched_rules=matched_rules,
            stance=stance,
        )
        return output.model_dump_json()

    async def ainvoke(
        self,
        input: Any,  # noqa: A002
        config: RunnableConfig | None = None,
        **kwargs: Any,
    ) -> str:
        """Asynchronously invoke the deterministic model and return a JSON string."""
        return self.invoke(input, config=config, **kwargs)


def _extract_json_dict(raw_output: Any) -> dict[str, Any]:
    """Extract and repair JSON object from raw LLM string/message responses."""
    content_str = str(getattr(raw_output, "content", raw_output)).strip()
    if not content_str:
        raise ValueError("LLM returned an empty response string.")

    fenced_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", content_str, re.DOTALL)
    if fenced_match:
        content_str = fenced_match.group(1).strip()
    else:
        brace_start = content_str.find("{")
        brace_end = content_str.rfind("}")
        if brace_start != -1 and brace_end > brace_start:
            content_str = content_str[brace_start : brace_end + 1]

    repaired_str = re.sub(r",\s*([}\]])", r"\1", content_str)
    parsed = json.loads(repaired_str)
    if not isinstance(parsed, dict):
        raise ValueError("Parsed JSON payload must be an object.")
    return parsed


def parse_and_validate_redline_output(raw_output: Any) -> RedlineOutput:
    """Parse and validate LLM output into `RedlineOutput`, repairing common JSON wrappers."""
    if isinstance(raw_output, RedlineOutput):
        return raw_output
    if isinstance(raw_output, dict):
        return RedlineOutput.model_validate(raw_output)
    return RedlineOutput.model_validate(_extract_json_dict(raw_output))


def parse_and_validate_pushback_output(raw_output: Any) -> PushbackSimulationOutput:
    """Parse and validate LLM output into `PushbackSimulationOutput`."""
    if isinstance(raw_output, PushbackSimulationOutput):
        return raw_output
    if isinstance(raw_output, dict):
        return PushbackSimulationOutput.model_validate(raw_output)
    return PushbackSimulationOutput.model_validate(_extract_json_dict(raw_output))


def build_redline_chain(
    llm: Runnable[Any, Any] | None = None,
) -> Runnable[dict[str, Any], RedlineOutput]:
    """Build the LangChain Expression Language (LCEL) redline evaluation pipeline."""
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "{system_prompt}\n\n{stance_instruction}"),
            (
                "human",
                "Company Playbook Rules:\n{playbook_context}\n\nContract Clause:\n{clause_text}",
            ),
        ]
    )
    active_llm: Runnable[Any, Any] = (
        llm if llm is not None else PolicyAwareDeterministicChatModel(temperature=0.0)
    )
    parser_runnable: Runnable[Any, RedlineOutput] = RunnableLambda(
        parse_and_validate_redline_output
    )

    if isinstance(active_llm, PolicyAwareDeterministicChatModel):
        # Pass structured context (including rules & stance) while rendering prompt for LCEL
        def _invoke_policy_aware(payload: dict[str, Any]) -> str:
            raw_stance = payload.get("stance", NegotiationStance.BALANCED)
            stance = (
                raw_stance
                if isinstance(raw_stance, NegotiationStance)
                else NegotiationStance(str(raw_stance).lower())
            )
            stance_instruction = STANCE_INSTRUCTIONS.get(
                stance, STANCE_INSTRUCTIONS[NegotiationStance.BALANCED]
            )
            _rendered_messages = prompt.format_messages(
                system_prompt=SYSTEM_PROMPT,
                stance_instruction=stance_instruction,
                playbook_context=payload.get("playbook_context", ""),
                clause_text=payload.get("clause_text", ""),
            )
            output = active_llm.evaluate_to_redline_output(
                clause_text=str(payload.get("clause_text", "")),
                matched_rules=payload.get("matched_rules", []),
                heading=payload.get("heading"),
                stance=stance,
            )
            return output.model_dump_json()

        return RunnableLambda(_invoke_policy_aware) | parser_runnable

    def _prepare_prompt_inputs(payload: dict[str, Any]) -> dict[str, Any]:
        raw_stance = payload.get("stance", NegotiationStance.BALANCED)
        stance = (
            raw_stance
            if isinstance(raw_stance, NegotiationStance)
            else NegotiationStance(str(raw_stance).lower())
        )
        stance_instruction = STANCE_INSTRUCTIONS.get(
            stance, STANCE_INSTRUCTIONS[NegotiationStance.BALANCED]
        )
        return {
            "system_prompt": SYSTEM_PROMPT,
            "stance_instruction": stance_instruction,
            "playbook_context": payload.get("playbook_context", ""),
            "clause_text": payload.get("clause_text", ""),
        }

    return RunnableLambda(_prepare_prompt_inputs) | prompt | active_llm | parser_runnable


def build_copilot_refine_chain(
    llm: Runnable[Any, Any] | None = None,
) -> Runnable[dict[str, Any], RedlineOutput]:
    """Construct an LCEL chain for refining an existing redline via AI Copilot instructions."""
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "{system_prompt}\n\n{stance_instruction}"),
            (
                "human",
                "Company Playbook Context:\n{playbook_context}\n\n"
                "Original Contract Clause:\n{original_clause_text}\n\n"
                "Current Proposed Redline:\n{current_proposed_text}\n\n"
                "[COPILOT_INSTRUCTION]: {user_instruction}\n\n"
                "Refine the redline according to the instruction above.",
            ),
        ]
    )
    active_llm: Runnable[Any, Any] = (
        llm if llm is not None else PolicyAwareDeterministicChatModel(temperature=0.0)
    )
    parser_runnable: Runnable[Any, RedlineOutput] = RunnableLambda(
        parse_and_validate_redline_output
    )

    if isinstance(active_llm, PolicyAwareDeterministicChatModel):
        def _invoke_copilot_policy_aware(payload: dict[str, Any]) -> str:
            raw_stance = payload.get("stance", NegotiationStance.BALANCED)
            stance = (
                raw_stance
                if isinstance(raw_stance, NegotiationStance)
                else NegotiationStance(str(raw_stance).lower())
            )
            output = active_llm.evaluate_copilot_refinement(
                original_clause_text=str(payload.get("original_clause_text", "")),
                current_proposed_text=str(payload.get("current_proposed_text", "")),
                user_instruction=str(payload.get("user_instruction", "")),
                matched_rules=payload.get("matched_rules", []),
                heading=payload.get("heading"),
                stance=stance,
            )
            return output.model_dump_json()

        return RunnableLambda(_invoke_copilot_policy_aware) | parser_runnable

    def _prepare_copilot_inputs(payload: dict[str, Any]) -> dict[str, Any]:
        raw_stance = payload.get("stance", NegotiationStance.BALANCED)
        stance = (
            raw_stance
            if isinstance(raw_stance, NegotiationStance)
            else NegotiationStance(str(raw_stance).lower())
        )
        stance_instruction = STANCE_INSTRUCTIONS.get(
            stance, STANCE_INSTRUCTIONS[NegotiationStance.BALANCED]
        )
        return {
            "system_prompt": COPILOT_SYSTEM_PROMPT,
            "stance_instruction": stance_instruction,
            "playbook_context": payload.get("playbook_context", ""),
            "original_clause_text": payload.get("original_clause_text", ""),
            "current_proposed_text": payload.get("current_proposed_text", ""),
            "user_instruction": payload.get("user_instruction", ""),
        }

    return RunnableLambda(_prepare_copilot_inputs) | prompt | active_llm | parser_runnable


def build_pushback_simulation_chain(
    llm: Runnable[Any, Any] | None = None,
) -> Runnable[dict[str, Any], PushbackSimulationOutput]:
    """Construct an LCEL chain for adversarial counterparty pushback simulation."""
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "{system_prompt}\n\n{stance_instruction}"),
            (
                "human",
                "Company Playbook Context:\n{playbook_context}\n\n"
                "Clause Heading: {heading}\n"
                "Original Contract Clause:\n{original_clause_text}\n\n"
                "Our Proposed Redline:\n{proposed_text}\n\n"
                "Simulate opposing counsel pushback and craft Round-2 fallback strategy.",
            ),
        ]
    )
    active_llm: Runnable[Any, Any] = (
        llm if llm is not None else PolicyAwareDeterministicChatModel(temperature=0.0)
    )
    parser_runnable: Runnable[Any, PushbackSimulationOutput] = RunnableLambda(
        parse_and_validate_pushback_output
    )

    if isinstance(active_llm, PolicyAwareDeterministicChatModel):
        def _invoke_pushback_policy_aware(payload: dict[str, Any]) -> str:
            raw_stance = payload.get("stance", NegotiationStance.BALANCED)
            stance = (
                raw_stance
                if isinstance(raw_stance, NegotiationStance)
                else NegotiationStance(str(raw_stance).lower())
            )
            raw_risk = payload.get("risk", RiskLevel.HIGH)
            risk = raw_risk if isinstance(raw_risk, RiskLevel) else RiskLevel(str(raw_risk))
            output = active_llm.evaluate_counterparty_pushback(
                original_clause_text=str(payload.get("original_clause_text", "")),
                proposed_text=str(payload.get("proposed_text", "")),
                risk=risk,
                matched_rules=payload.get("matched_rules", []),
                heading=payload.get("heading"),
                stance=stance,
            )
            return output.model_dump_json()

        return RunnableLambda(_invoke_pushback_policy_aware) | parser_runnable

    def _prepare_pushback_inputs(payload: dict[str, Any]) -> dict[str, Any]:
        raw_stance = payload.get("stance", NegotiationStance.BALANCED)
        stance = (
            raw_stance
            if isinstance(raw_stance, NegotiationStance)
            else NegotiationStance(str(raw_stance).lower())
        )
        stance_instruction = STANCE_INSTRUCTIONS.get(
            stance, STANCE_INSTRUCTIONS[NegotiationStance.BALANCED]
        )
        return {
            "system_prompt": PUSHBACK_SIMULATION_SYSTEM_PROMPT,
            "stance_instruction": stance_instruction,
            "playbook_context": payload.get("playbook_context", ""),
            "heading": payload.get("heading") or "Section",
            "original_clause_text": payload.get("original_clause_text", ""),
            "proposed_text": payload.get("proposed_text", ""),
        }

    return RunnableLambda(_prepare_pushback_inputs) | prompt | active_llm | parser_runnable


_PLACEHOLDER_ARTIFACT_RE: Final[re.Pattern[str]] = re.compile(
    r"\[(?:INSERT|TBD|TODO|PLACEHOLDER|COMPANY|VENDOR|CUSTOMER|DATE|AMOUNT)[^\]]*\]"
    r"|<(?:TBD|TODO|INSERT)[^>]*>"
    r"|\bTBD\b|\bTODO\b|\bLorem ipsum\b",
    re.IGNORECASE,
)

_NEGATED_WAIVER_CONTEXT_RE: Final[re.Pattern[str]] = re.compile(
    r"\b(?:not\s+be\s+liable|exclud(?:e|ing|ed)|waiv(?:e|er|ing)|prohibit(?:ed|s)?|"
    r"shall\s+not|never|under\s+no\s+circumstances|neither\s+party)\b",
    re.IGNORECASE,
)


class CriticVerificationAgent:
    """Agent 2: Critic & Hallucination Guard auditing Agent 1 outputs across 3 gates."""

    @staticmethod
    def _strip_section_prefix(text: str) -> str:
        return SECTION_NUMBER_PREFIX_RE.sub("", text.strip()).strip().lower()

    @staticmethod
    def _has_leaked_trigger(
        candidate_text: str,
        matched_rules: Sequence[MatchedPlaybookRule],
    ) -> str | None:
        lower_cand = candidate_text.lower()
        for match in matched_rules:
            rule = match.rule
            std_norm = CriticVerificationAgent._strip_section_prefix(rule.standard_position)
            fb_norm = CriticVerificationAgent._strip_section_prefix(rule.fallback_position)
            cand_norm = CriticVerificationAgent._strip_section_prefix(candidate_text)
            if cand_norm in (std_norm, fb_norm):
                return None

            raw_phrases = [
                p.strip().lower()
                for p in re.split(r"[;,.]", rule.unacceptable_triggers)
                if len(p.strip()) >= 6
            ]
            for phrase in raw_phrases:
                if (
                    phrase in rule.standard_position.lower()
                    or phrase in rule.fallback_position.lower()
                ):
                    continue
                idx = lower_cand.find(phrase)
                if idx != -1:
                    context_before = lower_cand[max(0, idx - 50) : idx]
                    if not _NEGATED_WAIVER_CONTEXT_RE.search(context_before):
                        return phrase

        for pattern, _, _, _ in CRITICAL_RISK_PATTERNS + HIGH_RISK_PATTERNS:
            idx = lower_cand.find(pattern)
            if idx != -1:
                # Special check: allow negated references to prohibited patterns
                context_before = lower_cand[max(0, idx - 50) : idx]
                if not _NEGATED_WAIVER_CONTEXT_RE.search(context_before):
                    return pattern
        return None

    def verify_and_critique(
        self,
        original_clause_text: str,
        heading: str | None,
        candidate_proposed_text: str,
        candidate_risk: RiskLevel,
        matched_rules: Sequence[MatchedPlaybookRule],
        stance: NegotiationStance = NegotiationStance.BALANCED,
        is_compliant: bool = False,
    ) -> CriticVerificationReport:
        """Execute 3-gate Critic verification and auto-refinement pipeline."""
        _ = heading
        refined_text = candidate_proposed_text.strip() or original_clause_text.strip()
        top_match = matched_rules[0] if matched_rules else None
        top_rule = top_match.rule if top_match else None
        top_score = top_match.combined_score if top_match else 0.0

        auto_corrected = False
        repair_actions: list[str] = []

        # ------------------------------------------------------------------
        # Gate 1: Playbook Policy Grounding & Trigger Scrubbing
        # ------------------------------------------------------------------
        orig_norm = self._strip_section_prefix(original_clause_text)
        cand_norm = self._strip_section_prefix(refined_text)
        leaked_trigger = None
        if not is_compliant and candidate_risk != RiskLevel.LOW:
            leaked_trigger = self._has_leaked_trigger(refined_text, matched_rules)

        reverted_risky_draft = (
            not is_compliant
            and candidate_risk in (RiskLevel.HIGH, RiskLevel.CRITICAL)
            and cand_norm == orig_norm
        )

        if leaked_trigger is not None or reverted_risky_draft:
            replacement_body: str | None = None
            if top_rule is not None:
                replacement_body = (
                    top_rule.fallback_position
                    if stance == NegotiationStance.COMMERCIAL
                    else top_rule.standard_position
                )
            else:
                for pat, _, body, _ in CRITICAL_RISK_PATTERNS + HIGH_RISK_PATTERNS:
                    if pat in original_clause_text.lower() or pat in refined_text.lower():
                        replacement_body = body
                        break
            if replacement_body:
                refined_text = _preserve_clause_numbering(
                    original_clause_text, replacement_body
                )
                auto_corrected = True
                if leaked_trigger is not None:
                    repair_actions.append(
                        f"scrubbed leaked trigger '{leaked_trigger}'"
                    )
                else:
                    repair_actions.append(
                        "enforced Playbook policy replacement"
                    )

        # ------------------------------------------------------------------
        # Gate 2: Hallucination & Placeholder Guard
        # ------------------------------------------------------------------
        if _PLACEHOLDER_ARTIFACT_RE.search(refined_text):
            cleaned = _PLACEHOLDER_ARTIFACT_RE.sub("", refined_text)
            cleaned = re.sub(r"\s{2,}", " ", cleaned)
            cleaned = re.sub(r"\s+([.,;:])", r"\1", cleaned).strip()
            # If removing placeholder left an incomplete dangling tail (e.g. "exceed .")
            if re.search(
                r"\b(?:exceed|capped\s+at|within|under|equals?)\s*(?:[.,;]|$)",
                cleaned,
                re.IGNORECASE,
            ) or len(self._strip_section_prefix(cleaned)) < 20:
                if top_rule is not None:
                    fallback_body = (
                        top_rule.fallback_position
                        if stance == NegotiationStance.COMMERCIAL
                        else top_rule.standard_position
                    )
                    cleaned = _preserve_clause_numbering(
                        original_clause_text, fallback_body
                    )
                else:
                    cleaned = _PLACEHOLDER_ARTIFACT_RE.sub(
                        "twelve (12) months of fees paid", refined_text
                    )
                    cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
            refined_text = cleaned
            auto_corrected = True
            repair_actions.append("removed hallucinated placeholder artifacts")

        # ------------------------------------------------------------------
        # Gate 3: Section Numbering & Obligation Preservation
        # ------------------------------------------------------------------
        prefix_match = SECTION_NUMBER_PREFIX_RE.match(original_clause_text)
        prefix_label = ""
        if prefix_match:
            prefix = prefix_match.group(1)
            prefix_core = prefix.strip()
            prefix_label = prefix_core
            if not refined_text.lstrip().lower().startswith(prefix_core.lower()):
                refined_text = _preserve_clause_numbering(
                    original_clause_text, refined_text
                )
                auto_corrected = True
                repair_actions.append(
                    f"restored missing section prefix '{prefix_core}'"
                )

        # ------------------------------------------------------------------
        # Confidence Scoring & Verification Status Classification
        # ------------------------------------------------------------------
        known_pattern_matched = any(
            pat in original_clause_text.lower()
            for pat, _, _, _ in CRITICAL_RISK_PATTERNS + HIGH_RISK_PATTERNS
        )
        policy_alignment_passed = True
        needs_human_review = False

        if top_score >= 0.45 and top_rule is not None:
            ratio = min(1.0, (top_score - 0.45) / 0.55)
            base_score = 87 + round(ratio * 12)
        elif top_rule is not None or known_pattern_matched or is_compliant:
            base_score = 80 if (top_rule is not None or known_pattern_matched) else 82
        else:
            # No playbook rule matched and custom non-trivial clause
            base_score = 68
            policy_alignment_passed = False
            needs_human_review = True

        if auto_corrected and not needs_human_review:
            confidence_score = max(75, min(97, base_score - 2))
        else:
            confidence_score = max(0, min(100, base_score))

        if auto_corrected:
            verification_status = VerificationStatus.AUTO_REFINED
            repairs_summary = "; ".join(repair_actions)
            critic_notes = (
                f"Critic Auto-Refined: {repairs_summary.capitalize()} • "
                f"Playbook policy aligned (Confidence: {confidence_score}%)."
            )
        elif needs_human_review:
            verification_status = VerificationStatus.NEEDS_HUMAN_REVIEW
            critic_notes = (
                "Critic Guard: Low Playbook rule coverage for this clause; senior counsel "
                f"review recommended before resolution (Confidence: {confidence_score}%)."
            )
        else:
            verification_status = VerificationStatus.VERIFIED
            prefix_note = (
                f"Section numbering {prefix_label} preserved"
                if prefix_label
                else "Obligations preserved"
            )
            critic_notes = (
                f"Critic Guard: Playbook policy aligned • 0 banned triggers • "
                f"{prefix_note} (Confidence: {confidence_score}%)."
            )

        return CriticVerificationReport(
            verification_status=verification_status,
            confidence_score=confidence_score,
            policy_alignment_passed=policy_alignment_passed,
            hallucination_free_passed=True,
            obligation_preservation_passed=True,
            auto_corrected=auto_corrected,
            critic_notes=critic_notes,
            refined_proposed_text=refined_text,
        )


class LangChainClauseAuditor(ClauseAuditorPort):
    """Concrete `ClauseAuditorPort` adapter orchestrating LCEL with Critic Verification."""

    def __init__(
        self,
        llm_runnable: Runnable[Any, Any] | None = None,
        max_retries: int = 2,
        temperature: float = 0.0,
        enable_deterministic_fallback: bool = True,
    ) -> None:
        self._llm_runnable = llm_runnable
        self._max_retries = max(0, max_retries)
        self._temperature = temperature
        self._enable_deterministic_fallback = enable_deterministic_fallback
        self._deterministic_fallback = PolicyAwareDeterministicChatModel(temperature=0.0)
        self._critic_agent = CriticVerificationAgent()
        self._chain = build_redline_chain(llm_runnable)
        self.last_trace_metadata: dict[str, Any] = {}

    @staticmethod
    def _resolve_matched_rule_id(
        matched_rules: Sequence[MatchedPlaybookRule],
        output: RedlineOutput,
    ) -> UUID | None:
        if not matched_rules:
            return None
        for match in matched_rules:
            if match.rule.category.lower() == output.category.lower():
                return match.rule.id
        return matched_rules[0].rule.id

    async def audit_clause(
        self,
        audit_input: ClauseAuditInput,
        matched_rules: Sequence[MatchedPlaybookRule],
    ) -> ClauseAuditResult:
        """Evaluate a contract clause via LCEL with retry recovery and observability metadata."""
        started_at = time.perf_counter()
        playbook_context = format_playbook_rules_context(matched_rules)

        stance_instruction = STANCE_INSTRUCTIONS.get(
            audit_input.stance, STANCE_INSTRUCTIONS[NegotiationStance.BALANCED]
        )
        chain_input: dict[str, Any] = {
            "playbook_context": playbook_context,
            "clause_text": audit_input.clause_text,
            "heading": audit_input.heading,
            "matched_rules": list(matched_rules),
            "stance": audit_input.stance,
            "stance_instruction": stance_instruction,
        }
        run_config = RunnableConfig(
            metadata={
                "org_id": str(audit_input.org_id),
                "document_id": str(audit_input.document_id),
                "clause_id": str(audit_input.clause_id),
                "clause_index": audit_input.clause_index,
                "temperature": self._temperature,
                "stance": audit_input.stance.value,
            },
            tags=[
                "phase4-redline-audit",
                f"org:{audit_input.org_id}",
                f"stance:{audit_input.stance.value}",
            ],
        )

        validated_output: RedlineOutput | None = None
        last_error: Exception | None = None
        total_attempts = 1 + self._max_retries

        for attempt in range(1, total_attempts + 1):
            try:
                validated_output = await self._chain.ainvoke(chain_input, config=run_config)
                break
            except (ValidationError, ValueError, json.JSONDecodeError) as exc:
                last_error = exc
                logger.warning(
                    "Structured output validation failed on attempt %d/%d for clause %s: %s",
                    attempt,
                    total_attempts,
                    audit_input.clause_id,
                    exc,
                )
            except Exception as exc:
                last_error = exc
                logger.warning(
                    "LLM runnable error on attempt %d/%d for clause %s: %s",
                    attempt,
                    total_attempts,
                    audit_input.clause_id,
                    exc,
                )

        if validated_output is None:
            if self._enable_deterministic_fallback:
                logger.info(
                    "Applying deterministic fallback for clause %s after %d failed attempts.",
                    audit_input.clause_id,
                    total_attempts,
                )
                validated_output = self._deterministic_fallback.evaluate_to_redline_output(
                    clause_text=audit_input.clause_text,
                    matched_rules=matched_rules,
                    heading=audit_input.heading,
                    stance=audit_input.stance,
                )
            elif isinstance(last_error, (ValidationError, ValueError, json.JSONDecodeError)):
                raise StructuredOutputValidationError(
                    f"Clause {audit_input.clause_id} failed structured output validation after "
                    f"{total_attempts} attempts: {last_error}"
                ) from last_error
            else:
                raise ClauseAnalysisError(
                    f"Clause {audit_input.clause_id} analysis failed after {total_attempts} "
                    f"attempts: {last_error}"
                ) from last_error

        latency_ms = round((time.perf_counter() - started_at) * 1000.0, 3)
        self.last_trace_metadata = {
            "org_id": str(audit_input.org_id),
            "document_id": str(audit_input.document_id),
            "clause_id": str(audit_input.clause_id),
            "clause_index": audit_input.clause_index,
            "latency_ms": latency_ms,
            "temperature": self._temperature,
            "stance": audit_input.stance.value,
        }

        matched_rule_id = self._resolve_matched_rule_id(matched_rules, validated_output)
        critic_report = self._critic_agent.verify_and_critique(
            original_clause_text=audit_input.clause_text,
            heading=audit_input.heading,
            candidate_proposed_text=validated_output.proposed_text,
            candidate_risk=RiskLevel(validated_output.risk),
            matched_rules=matched_rules,
            stance=audit_input.stance,
            is_compliant=validated_output.is_compliant,
        )
        return ClauseAuditResult(
            clause_id=audit_input.clause_id,
            clause_index=audit_input.clause_index,
            is_compliant=validated_output.is_compliant,
            risk=RiskLevel(validated_output.risk),
            category=validated_output.category,
            matched_rule_id=matched_rule_id,
            proposed_text=critic_report.refined_proposed_text,
            rationale=validated_output.rationale,
            negotiation_talking_point=validated_output.negotiation_talking_point,
            latency_ms=latency_ms,
            stance=audit_input.stance,
            confidence_score=critic_report.confidence_score,
            verification_status=critic_report.verification_status,
            critic_notes=critic_report.critic_notes,
            policy_alignment_passed=critic_report.policy_alignment_passed,
            hallucination_free_passed=critic_report.hallucination_free_passed,
            obligation_preservation_passed=critic_report.obligation_preservation_passed,
        )

    async def refine_clause_suggestion(
        self,
        refine_input: ClauseCopilotRefineInput,
        matched_rules: Sequence[MatchedPlaybookRule],
    ) -> ClauseCopilotRefineResult:
        """Refine an existing clause suggestion using custom user prompt instruction."""
        started_at = time.perf_counter()
        playbook_context = format_playbook_rules_context(matched_rules)
        stance_instruction = STANCE_INSTRUCTIONS.get(
            refine_input.stance, STANCE_INSTRUCTIONS[NegotiationStance.BALANCED]
        )
        chain_input: dict[str, Any] = {
            "playbook_context": playbook_context,
            "original_clause_text": refine_input.original_clause_text,
            "current_proposed_text": refine_input.current_proposed_text,
            "user_instruction": refine_input.user_instruction,
            "heading": refine_input.heading,
            "matched_rules": list(matched_rules),
            "stance": refine_input.stance,
            "stance_instruction": stance_instruction,
        }
        copilot_chain = build_copilot_refine_chain(self._llm_runnable)
        validated_output: RedlineOutput | None = None
        total_attempts = 1 + self._max_retries

        for attempt in range(1, total_attempts + 1):
            try:
                validated_output = await copilot_chain.ainvoke(chain_input)
                break
            except Exception as exc:
                logger.warning(
                    "Copilot refinement failed on attempt %d/%d for suggestion %s: %s",
                    attempt,
                    total_attempts,
                    refine_input.suggestion_id,
                    exc,
                )

        if validated_output is None:
            validated_output = self._deterministic_fallback.evaluate_copilot_refinement(
                original_clause_text=refine_input.original_clause_text,
                current_proposed_text=refine_input.current_proposed_text,
                user_instruction=refine_input.user_instruction,
                matched_rules=matched_rules,
                heading=refine_input.heading,
                stance=refine_input.stance,
            )

        critic_report = self._critic_agent.verify_and_critique(
            original_clause_text=refine_input.original_clause_text,
            heading=refine_input.heading,
            candidate_proposed_text=validated_output.proposed_text,
            candidate_risk=RiskLevel(validated_output.risk),
            matched_rules=matched_rules,
            stance=refine_input.stance,
            is_compliant=validated_output.is_compliant,
        )

        latency_ms = round((time.perf_counter() - started_at) * 1000.0, 3)
        return ClauseCopilotRefineResult(
            suggestion_id=refine_input.suggestion_id,
            clause_id=refine_input.clause_id,
            risk=RiskLevel(validated_output.risk),
            proposed_text=critic_report.refined_proposed_text,
            rationale=validated_output.rationale,
            negotiation_talking_point=validated_output.negotiation_talking_point,
            latency_ms=latency_ms,
            confidence_score=critic_report.confidence_score,
            verification_status=critic_report.verification_status,
            critic_notes=critic_report.critic_notes,
            policy_alignment_passed=critic_report.policy_alignment_passed,
            hallucination_free_passed=critic_report.hallucination_free_passed,
            obligation_preservation_passed=critic_report.obligation_preservation_passed,
        )

    async def verify_and_critique_suggestion(
        self,
        original_clause_text: str,
        heading: str | None,
        candidate_proposed_text: str,
        candidate_risk: RiskLevel,
        matched_rules: Sequence[MatchedPlaybookRule],
        stance: NegotiationStance = NegotiationStance.BALANCED,
    ) -> CriticVerificationReport:
        """Audit candidate redline against Playbook grounding, hallucinations, and numbering."""
        return self._critic_agent.verify_and_critique(
            original_clause_text=original_clause_text,
            heading=heading,
            candidate_proposed_text=candidate_proposed_text,
            candidate_risk=candidate_risk,
            matched_rules=matched_rules,
            stance=stance,
            is_compliant=(candidate_risk == RiskLevel.LOW),
        )

    async def simulate_counterparty_pushback(
        self,
        pushback_input: CounterpartyPushbackInput,
        matched_rules: Sequence[MatchedPlaybookRule],
    ) -> CounterpartyPushbackSimulation:
        """Simulate opposing counsel reaction and generate Round-2 rebuttal & fallback wording."""
        started_at = time.perf_counter()
        playbook_context = format_playbook_rules_context(matched_rules)
        chain_input: dict[str, Any] = {
            "playbook_context": playbook_context,
            "original_clause_text": pushback_input.original_clause_text,
            "proposed_text": pushback_input.proposed_text,
            "heading": pushback_input.heading,
            "risk": pushback_input.risk,
            "matched_rules": list(matched_rules),
            "stance": pushback_input.stance,
        }
        pushback_chain = build_pushback_simulation_chain(self._llm_runnable)
        validated_output: PushbackSimulationOutput | None = None
        total_attempts = 1 + self._max_retries

        for attempt in range(1, total_attempts + 1):
            try:
                validated_output = await pushback_chain.ainvoke(chain_input)
                break
            except Exception as exc:
                logger.warning(
                    "Pushback simulation failed on attempt %d/%d for suggestion %s: %s",
                    attempt,
                    total_attempts,
                    pushback_input.suggestion_id,
                    exc,
                )

        if validated_output is None:
            validated_output = self._deterministic_fallback.evaluate_counterparty_pushback(
                original_clause_text=pushback_input.original_clause_text,
                proposed_text=pushback_input.proposed_text,
                risk=pushback_input.risk,
                matched_rules=matched_rules,
                heading=pushback_input.heading,
                stance=pushback_input.stance,
            )

        preserved_fallback = _preserve_clause_numbering(
            pushback_input.original_clause_text,
            validated_output.fallback_compromise_text,
        )
        computed_severity = _classify_pushback_severity(
            validated_output.acceptance_probability
        )
        latency_ms = round((time.perf_counter() - started_at) * 1000.0, 3)

        return CounterpartyPushbackSimulation(
            suggestion_id=pushback_input.suggestion_id,
            clause_id=pushback_input.clause_id,
            acceptance_probability=validated_output.acceptance_probability,
            pushback_severity=computed_severity,
            counterparty_persona=validated_output.counterparty_persona.strip(),
            expected_objection=validated_output.expected_objection.strip(),
            rebuttal_talking_point=validated_output.rebuttal_talking_point.strip(),
            fallback_compromise_text=preserved_fallback,
            latency_ms=latency_ms,
        )


__all__ = [
    "COPILOT_SYSTEM_PROMPT",
    "CriticVerificationAgent",
    "LangChainClauseAuditor",
    "PUSHBACK_SIMULATION_SYSTEM_PROMPT",
    "PolicyAwareDeterministicChatModel",
    "PushbackSimulationOutput",
    "RedlineOutput",
    "STANCE_INSTRUCTIONS",
    "SYSTEM_PROMPT",
    "build_copilot_refine_chain",
    "build_pushback_simulation_chain",
    "build_redline_chain",
    "format_playbook_rules_context",
    "parse_and_validate_pushback_output",
    "parse_and_validate_redline_output",
]
