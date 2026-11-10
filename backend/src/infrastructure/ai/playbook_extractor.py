"""AI Playbook Auto-Extractor converting Golden Contract clauses into Playbook Rules."""

import json
import logging
import re
from dataclasses import dataclass
from typing import Any, Final

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable, RunnableConfig
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from src.domain.entities import ExtractedPlaybookRuleCandidate
from src.domain.ports import PlaybookExtractorPort
from src.infrastructure.ai.redline_chain import PolicyAwareDeterministicChatModel

logger = logging.getLogger(__name__)

PLAYBOOK_EXTRACTION_SYSTEM_PROMPT: Final[str] = (
    "You are a Principal LegalTech Counsel & Playbook Knowledge Architect. "
    "Analyze the provided clauses from a signed 'Golden Contract' or approved corporate template "
    "and extract structured Company Playbook Rules that the legal team can enforce on future "
    "counterparty agreements.\n\n"
    "Respond ONLY with a valid JSON object matching this exact schema:\n"
    "{\n"
    '  "rules": [\n'
    "    {\n"
    '      "category": string (e.g. "Liability", "Indemnification", "Data Privacy & AI", '
    '"SLA & Uptime", "Payment Terms", "IP Ownership", "Termination", "Confidentiality"),\n'
    '      "standard_position": string (concise, enforceable preferred corporate baseline),\n'
    '      "fallback_position": string (pre-approved reasonable compromise boundary),\n'
    '      "unacceptable_triggers": [string, ...] (2 to 4 counterparty red-flag phrases),\n'
    '      "source_clause_excerpt": string (exact verbatim excerpt from the source clause),\n'
    '      "confidence_score": integer (0 to 100)\n'
    "    }\n"
    "  ]\n"
    "}"
)

_RE_SECTION_BOUNDARY = re.compile(
    r"(?:^|\n)(?=(?:\d+(?:\.\d+)*\.?\s+|Section\s+\d+|Article\s+[IVXLCDM0-9]+|Clause\s+\d+))",
    re.IGNORECASE,
)
_RE_HEADING_PREFIX = re.compile(
    r"^(?:\d+(?:\.\d+)*\.?\s+|Section\s+\d+(?:\.\d+)*[:.]?\s+|"
    r"Article\s+[IVXLCDM0-9]+[:.]?\s+|Clause\s+\d+(?:\.\d+)*[:.]?\s+)"
    r"([A-Z][A-Za-z0-9\s,&/-]{2,55})(?:\.|:|\s+-+\s+|\n)",
    re.IGNORECASE,
)
_RE_MONEY_OR_CAP = re.compile(
    r"(\$[\d,]+(?:\.\d+)?(?:\s*(?:million|thousand|USD))?|"
    r"\b\d+\s*(?:months?|years?)\s+of\s+(?:fees|charges)[^.,;]*|\b2x\b|\b1x\b)",
    re.IGNORECASE,
)
_RE_NET_DAYS = re.compile(r"\b(?:Net\s+\d{1,3}|within\s+\d{1,3}\s+days?)\b", re.IGNORECASE)
_RE_PERCENTAGE = re.compile(r"\b(9\d(?:\.\d+)?%|100(?:\.0+)?%)\b")
_RE_CURE_DAYS = re.compile(
    r"\b(\d{1,3}[\s-]*(?:day|days|business\s+days))\s+(?:written\s+)?notice(?:\s+and\s+cure)?",
    re.IGNORECASE,
)


class ExtractedRuleItemSchema(BaseModel):
    """Pydantic schema validating a single LLM-extracted Playbook Rule."""

    model_config = ConfigDict(extra="ignore")

    category: str = Field(min_length=2, max_length=128)
    standard_position: str = Field(min_length=8, max_length=4000)
    fallback_position: str = Field(min_length=8, max_length=4000)
    unacceptable_triggers: list[str] = Field(min_length=1, max_length=12)
    source_clause_excerpt: str = Field(min_length=8, max_length=1200)
    confidence_score: int = Field(default=85, ge=0, le=100)


class ExtractedRulesBatchSchema(BaseModel):
    """Top-level JSON schema for LLM batch Playbook extraction."""

    model_config = ConfigDict(extra="ignore")

    rules: list[ExtractedRuleItemSchema] = Field(default_factory=list)


@dataclass(frozen=True, slots=True)
class _RuleDomainProfile:
    category: str
    keywords: tuple[str, ...]
    default_standard: str
    default_fallback: str
    default_triggers: tuple[str, ...]
    base_confidence: int


_DOMAIN_PROFILES: Final[tuple[_RuleDomainProfile, ...]] = (
    _RuleDomainProfile(
        category="Data Privacy & AI",
        keywords=(
            "foundation model",
            "train public",
            "ai model",
            "machine learning",
            "personal data",
            "gdpr",
            "ccpa",
            "data processing",
            "subprocessor",
            "security breach",
        ),
        default_standard=(
            "Vendor shall never use Customer Data to train public or third-party AI/ML models, "
            "shall comply with GDPR/CCPA DPA safeguards, and shall notify Customer within 24 hours "
            "of any confirmed security incident."
        ),
        default_fallback=(
            "Permits strictly anonymized and aggregated telemetry only after explicit written "
            "opt-in and obligates security incident notification within 72 hours."
        ),
        default_triggers=(
            "train public foundation models",
            "model training using customer data",
            "irrevocable license to customer data",
            "no breach notification timeline",
        ),
        base_confidence=94,
    ),
    _RuleDomainProfile(
        category="Liability",
        keywords=(
            "limitation of liability",
            "aggregate liability",
            "consequential damages",
            "indirect damages",
            "liable",
            "liability",
        ),
        default_standard=(
            "Mutual aggregate liability cap tied to fees paid in the preceding 12 months (or "
            "approved dollar floor) with mutual exclusion of indirect, special, and consequential "
            "damages and standard carve-outs for IP infringement and confidentiality."
        ),
        default_fallback=(
            "Mutual liability super-cap of 24 months of fees (or $1,000,000) for confidentiality "
            "and data security breaches while maintaining direct-damages limitation."
        ),
        default_triggers=(
            "unlimited liability",
            "uncapped consequential damages",
            "without any limitation whatsoever",
            "solely liable for indirect damages",
        ),
        base_confidence=95,
    ),
    _RuleDomainProfile(
        category="Indemnification",
        keywords=(
            "indemnif",
            "hold harmless",
            "third-party ip",
            "infringement claim",
            "defend and indemnify",
        ),
        default_standard=(
            "Mutual indemnification limited to third-party IP infringement, gross negligence, "
            "and willful misconduct, conditioned upon prompt notice and defense control."
        ),
        default_fallback=(
            "Capped third-party IP indemnification up to 2x fees paid with standard mitigation "
            "remedies (procure license, replace, or refund pro-rata)."
        ),
        default_triggers=(
            "indemnify without limit",
            "indemnify for counterparty own negligence",
            "unilateral unlimited indemnity",
        ),
        base_confidence=92,
    ),
    _RuleDomainProfile(
        category="SLA & Uptime",
        keywords=(
            "service level",
            "uptime",
            "availability",
            "sla",
            "service credits",
            "downtime",
            "latency",
            "recovery time",
        ),
        default_standard=(
            "Guarantee minimum 99.9% monthly service availability (excluding scheduled "
            "maintenance) backed by tiered service credits and termination right for chronic "
            "SLA failures."
        ),
        default_fallback=(
            "Accept 99.5% monthly availability target with service credits capped at 15% of the "
            "affected monthly subscription fees."
        ),
        default_triggers=(
            "best efforts uptime only",
            "no service level guarantee",
            "no service credits for downtime",
            "as-is availability without warranty",
        ),
        base_confidence=93,
    ),
    _RuleDomainProfile(
        category="Payment Terms",
        keywords=(
            "payment",
            "invoice",
            "invoicing",
            "net ",
            "fees",
            "billing",
            "late interest",
            "price increase",
        ),
        default_standard=(
            "Undisputed invoices payable Net 30 to Net 45 from receipt; Customer may withhold "
            "good-faith disputed charges without late interest or service suspension."
        ),
        default_fallback=(
            "Net 30 payment terms on undisputed amounts with late interest capped at 1.0% per "
            "month and written notice 60 days prior to renewal fee adjustments."
        ),
        default_triggers=(
            "due immediately upon receipt",
            "no right to dispute invoices",
            "unilateral unlimited price increase",
            "non-refundable upfront payment",
        ),
        base_confidence=91,
    ),
    _RuleDomainProfile(
        category="IP Ownership",
        keywords=(
            "intellectual property",
            "background ip",
            "foreground ip",
            "work made for hire",
            "proprietary rights",
            "ownership",
            "derivative work",
        ),
        default_standard=(
            "Customer retains exclusive ownership of pre-existing Background IP, Customer Data, "
            "and paid bespoke deliverables; Vendor retains its pre-existing platform technology."
        ),
        default_fallback=(
            "Vendor retains underlying tooling with a perpetual, irrevocable, royalty-free "
            "enterprise license granted to Customer for all integrated deliverables."
        ),
        default_triggers=(
            "assign all customer ip to vendor",
            "vendor owns all deliverables",
            "unrestricted license to customer trademarks",
        ),
        base_confidence=91,
    ),
    _RuleDomainProfile(
        category="Termination",
        keywords=(
            "termination",
            "terminate",
            "cure period",
            "auto-renew",
            "automatic renewal",
            "suspension",
        ),
        default_standard=(
            "Termination for material breach requires at least 30 days prior written notice and "
            "opportunity to cure; no unilateral suspension without notice; pro-rata refund of "
            "prepaid unused fees upon Vendor breach termination."
        ),
        default_fallback=(
            "15 business days cure period for undisputed non-payment and 60 days mutual "
            "non-renewal notice prior to expiration."
        ),
        default_triggers=(
            "terminate immediately without notice",
            "sole remedy waiver",
            "forfeiture of prepaid fees",
            "automatic 3-year renewal lock-in",
        ),
        base_confidence=92,
    ),
    _RuleDomainProfile(
        category="Confidentiality",
        keywords=(
            "confidential",
            "non-disclosure",
            "proprietary information",
            "trade secret",
        ),
        default_standard=(
            "Mutual strict confidentiality protecting Customer and Vendor Confidential Information "
            "for 5 years post-termination (indefinitely for trade secrets), permitting legally "
            "compelled disclosures only after prompt notice."
        ),
        default_fallback=(
            "Mutual 3-year post-termination survival period with standard affiliates and legal "
            "advisor need-to-know disclosure carve-outs."
        ),
        default_triggers=(
            "one-way confidentiality obligation",
            "confidentiality expires upon termination",
            "unrestricted sharing with third parties",
        ),
        base_confidence=90,
    ),
    _RuleDomainProfile(
        category="Governing Law",
        keywords=(
            "governing law",
            "jurisdiction",
            "arbitration",
            "venue",
            "dispute resolution",
        ),
        default_standard=(
            "Agreement governed by New York or Delaware law without conflict-of-law principles, "
            "with exclusive venue in mutually agreed federal or state courts."
        ),
        default_fallback=(
            "Neutral commercial arbitration under ICC or AAA rules in a mutually convenient "
            "metropolitan venue."
        ),
        default_triggers=(
            "mandatory foreign venue in counterparty hometown",
            "waiver of all injunctive relief",
        ),
        base_confidence=86,
    ),
)


def segment_reference_text(reference_text: str) -> list[str]:
    """Split pasted golden contract text into discrete, self-contained clause paragraphs."""
    cleaned = reference_text.strip()
    if not cleaned:
        return []

    raw_paragraphs = [p.strip() for p in re.split(r"\n\s*\n+", cleaned) if p.strip()]
    chunks: list[str] = []
    for para in raw_paragraphs:
        sub_parts = [part.strip() for part in _RE_SECTION_BOUNDARY.split(para) if part.strip()]
        if sub_parts:
            chunks.extend(sub_parts)
        else:
            chunks.append(para)

    if len(chunks) <= 1 and ";" in cleaned:
        semi_parts = [p.strip() for p in cleaned.split(";") if len(p.strip()) >= 25]
        if len(semi_parts) > 1:
            chunks = semi_parts

    filtered = [c for c in chunks if len(c) >= 20]
    return filtered if filtered else [cleaned]


def _make_excerpt(clause_text: str, max_len: int = 240) -> str:
    compact = re.sub(r"\s+", " ", clause_text).strip()
    if len(compact) <= max_len:
        return compact
    return compact[: max_len - 3].rstrip() + "..."


def _enrich_standard_with_clause_anchors(
    clause_text: str,
    profile: _RuleDomainProfile,
) -> tuple[str, int]:
    """Customize `standard_position` and confidence with quantitative figures found in clause."""
    confidence = profile.base_confidence
    anchors: list[str] = []

    if profile.category in ("Liability", "Indemnification"):
        cap_match = _RE_MONEY_OR_CAP.search(clause_text)
        if cap_match:
            anchors.append(f"Enforce golden contract baseline limit ({cap_match.group(1).strip()})")
            confidence = min(98, confidence + 2)
    elif profile.category == "SLA & Uptime":
        pct_match = _RE_PERCENTAGE.search(clause_text)
        if pct_match:
            anchors.append(f"Enforce {pct_match.group(1)} uptime guarantee from golden clause")
            confidence = min(98, confidence + 3)
    elif profile.category == "Payment Terms":
        net_match = _RE_NET_DAYS.search(clause_text)
        if net_match:
            anchors.append(f"Require {net_match.group(0)} payment baseline from golden template")
            confidence = min(98, confidence + 2)
    elif profile.category == "Termination":
        cure_match = _RE_CURE_DAYS.search(clause_text)
        if cure_match:
            anchors.append(
                f"Require {cure_match.group(1)} notice and cure window from approved policy"
            )
            confidence = min(97, confidence + 2)

    if not anchors:
        return profile.default_standard, confidence
    return f"{anchors[0]}. {profile.default_standard}", confidence


def _infer_general_category(clause_text: str) -> str:
    heading_match = _RE_HEADING_PREFIX.match(clause_text.strip())
    if heading_match:
        title = heading_match.group(1).strip()
        if 3 <= len(title) <= 45:
            return title.title()
    words = re.findall(r"[A-Za-z][A-Za-z0-9-]+", clause_text)
    if len(words) >= 2:
        return "Commercial Terms"
    return "General Policy"


def extract_rules_deterministically(
    clauses_text: list[str],
    max_rules: int = 8,
) -> list[ExtractedPlaybookRuleCandidate]:
    """Deterministically extract structured Playbook rule candidates from golden clauses."""
    bounded_max = max(1, min(20, max_rules))
    candidates: list[ExtractedPlaybookRuleCandidate] = []
    seen_categories: set[str] = set()

    for raw_clause in clauses_text:
        clause = raw_clause.strip()
        if len(clause) < 15:
            continue

        lowered = clause.lower()
        best_profile: _RuleDomainProfile | None = None
        best_hits = 0

        for profile in _DOMAIN_PROFILES:
            hits = sum(1 for kw in profile.keywords if kw in lowered)
            if hits > best_hits:
                best_hits = hits
                best_profile = profile

        if best_profile is not None:
            cat_key = best_profile.category.lower()
            if cat_key in seen_categories:
                continue
            seen_categories.add(cat_key)
            standard_pos, conf = _enrich_standard_with_clause_anchors(clause, best_profile)
            candidates.append(
                ExtractedPlaybookRuleCandidate(
                    category=best_profile.category,
                    standard_position=standard_pos,
                    fallback_position=best_profile.default_fallback,
                    unacceptable_triggers=list(best_profile.default_triggers),
                    source_clause_excerpt=_make_excerpt(clause),
                    confidence_score=conf,
                )
            )
        else:
            inferred_cat = _infer_general_category(clause)
            cat_key = inferred_cat.lower()
            if cat_key in seen_categories:
                continue
            seen_categories.add(cat_key)
            excerpt = _make_excerpt(clause, max_len=280)
            candidates.append(
                ExtractedPlaybookRuleCandidate(
                    category=inferred_cat,
                    standard_position=f"Maintain approved corporate wording baseline: {excerpt}",
                    fallback_position=(
                        f"Allow minor mutually agreed redlines to {inferred_cat} only if core "
                        "risk allocations and compliance obligations remain intact."
                    ),
                    unacceptable_triggers=[
                        "unilateral counterparty modification without consent",
                        "complete waiver of protective obligation",
                    ],
                    source_clause_excerpt=_make_excerpt(clause),
                    confidence_score=78,
                )
            )

        if len(candidates) >= bounded_max:
            break

    return candidates[:bounded_max]


def _extract_json_payload(raw_output: Any) -> dict[str, Any]:
    """Parse raw LLM string or dict response into a JSON object dict."""
    if isinstance(raw_output, dict):
        return raw_output
    text = str(getattr(raw_output, "content", raw_output)).strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.DOTALL).strip()

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
        if isinstance(parsed, list):
            return {"rules": parsed}
    except ValueError:
        pass

    start_obj = text.find("{")
    end_obj = text.rfind("}")
    if start_obj != -1 and end_obj > start_obj:
        parsed_obj = json.loads(text[start_obj : end_obj + 1])
        if isinstance(parsed_obj, dict):
            return parsed_obj
    raise ValueError("Playbook extraction output did not contain a valid JSON object.")


class LangChainPlaybookExtractor(PlaybookExtractorPort):
    """Extractor supporting live configured LLMs via LCEL with deterministic fallback."""

    def __init__(
        self,
        llm_runnable: Runnable[Any, Any] | None = None,
        max_retries: int = 1,
    ) -> None:
        self._llm_runnable = llm_runnable
        self._max_retries = max(0, max_retries)

    async def extract_rules_from_clauses(
        self,
        clauses_text: list[str],
        max_rules: int = 8,
    ) -> list[ExtractedPlaybookRuleCandidate]:
        """Extract up to `max_rules` structured Playbook rules from golden contract clauses."""
        cleaned_clauses = [c.strip() for c in clauses_text if c.strip()]
        if not cleaned_clauses:
            return []

        bounded_max = max(1, min(20, max_rules))
        if (
            self._llm_runnable is not None
            and not isinstance(self._llm_runnable, PolicyAwareDeterministicChatModel)
        ):
            llm_results = await self._try_extract_with_llm(cleaned_clauses, bounded_max)
            if llm_results:
                return llm_results

        return extract_rules_deterministically(cleaned_clauses, max_rules=bounded_max)

    async def _try_extract_with_llm(
        self,
        clauses_text: list[str],
        max_rules: int,
    ) -> list[ExtractedPlaybookRuleCandidate]:
        if self._llm_runnable is None:
            return []
        numbered_clauses = "\n\n".join(
            f"[Clause {idx + 1}]\n{text}" for idx, text in enumerate(clauses_text[:25])
        )
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", PLAYBOOK_EXTRACTION_SYSTEM_PROMPT),
                (
                    "human",
                    "Extract up to {max_rules} high-value, distinct Company Playbook rules "
                    "from the following Golden Contract clauses:\n\n{clauses_block}",
                ),
            ]
        )
        chain = prompt | self._llm_runnable
        run_config = RunnableConfig(tags=["ai-feature-6-playbook-extractor"])

        for attempt in range(1, 2 + self._max_retries):
            try:
                raw_response = await chain.ainvoke(
                    {"max_rules": max_rules, "clauses_block": numbered_clauses},
                    config=run_config,
                )
                payload = _extract_json_payload(raw_response)
                batch = ExtractedRulesBatchSchema.model_validate(payload)
                extracted: list[ExtractedPlaybookRuleCandidate] = []
                seen_categories: set[str] = set()
                for item in batch.rules:
                    cat_key = item.category.strip().lower()
                    if cat_key in seen_categories:
                        continue
                    seen_categories.add(cat_key)
                    extracted.append(
                        ExtractedPlaybookRuleCandidate(
                            category=item.category,
                            standard_position=item.standard_position,
                            fallback_position=item.fallback_position,
                            unacceptable_triggers=item.unacceptable_triggers,
                            source_clause_excerpt=item.source_clause_excerpt,
                            confidence_score=item.confidence_score,
                        )
                    )
                    if len(extracted) >= max_rules:
                        break
                if extracted:
                    return extracted
            except (ValidationError, ValueError, Exception) as exc:
                logger.warning(
                    "Live LLM playbook extraction attempt %d failed; falling back: %s",
                    attempt,
                    exc,
                )

        return []


__all__ = [
    "PLAYBOOK_EXTRACTION_SYSTEM_PROMPT",
    "ExtractedRuleItemSchema",
    "ExtractedRulesBatchSchema",
    "LangChainPlaybookExtractor",
    "extract_rules_deterministically",
    "segment_reference_text",
]
