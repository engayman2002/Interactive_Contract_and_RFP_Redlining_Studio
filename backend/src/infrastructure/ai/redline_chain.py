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
    MatchedPlaybookRule,
)
from src.domain.enums import NegotiationStance, RiskLevel
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


SYSTEM_PROMPT: Final[str] = """You are a Principal Legal and Technical Contract Auditor.
Compare the provided contract clause against the retrieved Company Playbook Rules.
If the clause violates policy or introduces unmitigated risk, generate a precise surgical redline
that protects the company while remaining commercially reasonable."""

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


def parse_and_validate_redline_output(raw_output: Any) -> RedlineOutput:
    """Parse and validate LLM output into `RedlineOutput`, repairing common JSON wrappers."""
    if isinstance(raw_output, RedlineOutput):
        return raw_output

    if isinstance(raw_output, dict):
        return RedlineOutput.model_validate(raw_output)

    content_str = str(getattr(raw_output, "content", raw_output)).strip()
    if not content_str:
        raise ValueError("LLM returned an empty response string.")

    # Strip Markdown code fences if present
    fenced_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", content_str, re.DOTALL)
    if fenced_match:
        content_str = fenced_match.group(1).strip()
    else:
        brace_start = content_str.find("{")
        brace_end = content_str.rfind("}")
        if brace_start != -1 and brace_end > brace_start:
            content_str = content_str[brace_start : brace_end + 1]

    # Repair trailing commas before closing brace/bracket
    repaired_str = re.sub(r",\s*([}\]])", r"\1", content_str)
    parsed_dict = json.loads(repaired_str)
    return RedlineOutput.model_validate(parsed_dict)


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


class LangChainClauseAuditor(ClauseAuditorPort):
    """Concrete `ClauseAuditorPort` adapter orchestrating LCEL with retries and tracing."""

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
        return ClauseAuditResult(
            clause_id=audit_input.clause_id,
            clause_index=audit_input.clause_index,
            is_compliant=validated_output.is_compliant,
            risk=RiskLevel(validated_output.risk),
            category=validated_output.category,
            matched_rule_id=matched_rule_id,
            proposed_text=validated_output.proposed_text,
            rationale=validated_output.rationale,
            negotiation_talking_point=validated_output.negotiation_talking_point,
            latency_ms=latency_ms,
            stance=audit_input.stance,
        )


__all__ = [
    "LangChainClauseAuditor",
    "PolicyAwareDeterministicChatModel",
    "RedlineOutput",
    "STANCE_INSTRUCTIONS",
    "SYSTEM_PROMPT",
    "build_redline_chain",
    "format_playbook_rules_context",
    "parse_and_validate_redline_output",
]
