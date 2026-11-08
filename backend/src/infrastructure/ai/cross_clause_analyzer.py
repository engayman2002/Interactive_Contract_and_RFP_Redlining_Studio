"""Cross-clause structural and semantic graph analyzer for contract integrity radar."""

import re
import time
from uuid import UUID, uuid4

from src.domain.entities import (
    CrossClauseAnalysisReport,
    CrossClauseFinding,
    DocumentClause,
)
from src.domain.enums import CrossClauseIssueType, RiskLevel
from src.domain.ports import CrossClauseAnalyzerPort

# Pre-compiled regex patterns for cross-clause detection
_RE_SECTION_REF = re.compile(
    r"\b(?:Section|Clause|Article|Paragraph)\s+([0-9]+(?:\.[0-9]+)*)\b",
    re.IGNORECASE,
)

_RE_DEFINED_TERM = re.compile(
    r"[\"“']([A-Z][A-Za-z0-9\s]{2,40})[\"”']\s+(?:means|shall\s+mean|has\s+the\s+meaning|is\s+defined)",
    re.IGNORECASE,
)

_RE_LIABILITY_CAP = re.compile(
    r"\b(?:exceed|cap(?:ped)?\s+at|limited\s+to|shall\s+not\s+exceed)\s+"
    r"(\$[\d,]+(?:\.\d+)?|\d+x\b|\d+\s+months?|\bthe\s+total\s+fees\b)",
    re.IGNORECASE,
)

_RE_UNCAPPED_INDEMNITY = re.compile(
    r"\b(?:uncapped|unlimited|without\s+limit(?:ation)?|without\s+regard\s+to\s+any\s+limitation|"
    r"negligence\s+without\s+limit|shall\s+have\s+uncapped\s+liability)\b",
    re.IGNORECASE,
)

_RE_PAYMENT_DAYS = re.compile(
    r"\b(?:Net|within)\s+(\d{1,3})\s+(?:days?|business\s+days)\b",
    re.IGNORECASE,
)

_RE_CURE_PERIOD = re.compile(
    r"(\d+[\s-]?(?:day|days|business\s+days))\s+(?:written\s+)?(?:notice\s+and\s+)?cure",
    re.IGNORECASE,
)

_RE_IMMEDIATE_TERMINATION = re.compile(
    r"\b(?:terminate\s+immediately\s+without\s+notice|sole\s+remedy\s+waiver|"
    r"without\s+(?:prior\s+)?(?:written\s+)?notice\s+or\s+cure)\b",
    re.IGNORECASE,
)

_RE_AI_TRAINING_PERMITTED = re.compile(
    r"\b(?:train\s+(?:AI\s+)?foundation\s+models|use\s+customer\s+data\s+for\s+model\s+training|"
    r"machine\s+learning\s+model\s+training)\b",
    re.IGNORECASE,
)

_RE_CONFIDENTIALITY_PROTECTED = re.compile(
    r"\b(?:not\s+use\s+Customer\s+Confidential\s+Information\s+to\s+train|"
    r"Customer\s+Confidential\s+Data\s+shall\s+remain|strictly\s+confidential\s+and\s+proprietary)\b",
    re.IGNORECASE,
)

# High-frequency specialized legal/technical contractual phrases
_SPECIALIZED_CANDIDATE_TERMS = (
    "Customer Confidential Data",
    "Public Foundation Models",
    "Service Level Credits",
    "Service Credits",
    "Force Majeure Event",
    "Direct Infringement Claims",
)


def _compute_integrity_score(findings: list[CrossClauseFinding]) -> int:
    """Compute 0-100% document integrity score from weighted defect penalties."""
    if not findings:
        return 100
    penalties = {
        RiskLevel.CRITICAL: 18,
        RiskLevel.HIGH: 12,
        RiskLevel.MEDIUM: 6,
        RiskLevel.LOW: 3,
    }
    total_penalty = sum(penalties.get(f.severity, 6) for f in findings)
    return max(15, min(100, 100 - total_penalty))


class LangChainCrossClauseAnalyzer(CrossClauseAnalyzerPort):
    """Production implementation of CrossClauseAnalyzerPort with graph analysis."""

    async def analyze_document_integrity(
        self,
        org_id: UUID,
        document_id: UUID,
        clauses: list[DocumentClause],
    ) -> CrossClauseAnalysisReport:
        """Analyze contract clause graph for contradictions, broken refs, and undefined terms."""
        start_time = time.perf_counter()
        findings: list[CrossClauseFinding] = []

        if not clauses:
            return CrossClauseAnalysisReport(
                document_id=document_id,
                total_findings=0,
                contradiction_count=0,
                broken_reference_count=0,
                undefined_term_count=0,
                integrity_score=100,
                findings=[],
                execution_time_ms=0.0,
            )

        # ------------------------------------------------------------------
        # Pass 1: Build Known Section & Clause Reference Map
        # ------------------------------------------------------------------
        known_sections: set[str] = set()
        for c in clauses:
            known_sections.add(str(c.clause_index + 1))
            if c.heading:
                heading_match = re.match(r"^(\d+(?:\.\d+)*)", c.heading.strip())
                if heading_match:
                    num_part = heading_match.group(1)
                    known_sections.add(num_part)
                    if "." in num_part:
                        known_sections.add(num_part.split(".")[0])
            # Check text prefix e.g. "1.1 In no event..."
            text_prefix_match = re.match(r"^(\d+(?:\.\d+)*)\s+", c.current_text.strip())
            if text_prefix_match:
                prefix_num = text_prefix_match.group(1)
                known_sections.add(prefix_num)
                if "." in prefix_num:
                    known_sections.add(prefix_num.split(".")[0])

        # ------------------------------------------------------------------
        # Pass 2: Extract Defined Contractual Terms
        # ------------------------------------------------------------------
        defined_terms: set[str] = set()
        for c in clauses:
            for match in _RE_DEFINED_TERM.finditer(c.current_text):
                term_val = match.group(1).strip()
                if term_val:
                    defined_terms.add(term_val.lower())

        # ------------------------------------------------------------------
        # Pass 3: Cross-Clause Contradiction Graph Inspection (Pairs)
        # ------------------------------------------------------------------
        for i, c1 in enumerate(clauses):
            c1_text = c1.current_text
            c1_cap_match = _RE_LIABILITY_CAP.search(c1_text)
            c1_pay_match = _RE_PAYMENT_DAYS.search(c1_text)
            c1_cure_match = _RE_CURE_PERIOD.search(c1_text)
            c1_conf_match = _RE_CONFIDENTIALITY_PROTECTED.search(c1_text)

            for c2 in clauses[i + 1 :]:
                c2_text = c2.current_text

                # Check 1: Capped Liability vs Uncapped Indemnity/Liability
                if c1_cap_match and _RE_UNCAPPED_INDEMNITY.search(c2_text):
                    cap_val = c1_cap_match.group(1)
                    findings.append(
                        CrossClauseFinding(
                            id=uuid4(),
                            issue_type=CrossClauseIssueType.CONTRADICTION,
                            severity=RiskLevel.CRITICAL,
                            source_clause_id=c1.id,
                            source_clause_index=c1.clause_index,
                            target_clause_id=c2.id,
                            target_clause_index=c2.clause_index,
                            title="Cross-Clause Liability & Indemnification Contradiction",
                            description=(
                                f"Clause #{c1.clause_index + 1} ({c1.heading or 'Liability'}) "
                                f"caps exposure at {cap_val}, but Clause #{c2.clause_index + 1} "
                                f"({c2.heading or 'Indemnity'}) creates uncapped, unlimited "
                                "exposure without a limitation carve-out."
                            ),
                            recommended_fix=(
                                f"Harmonize clauses by making indemnification obligations subject "
                                f"to the aggregate liability cap in Clause #{c1.clause_index + 1}."
                            ),
                        )
                    )

                # Check 2: Conflicting Payment Days (e.g. Net 30 vs Net 15)
                c2_pay_match = _RE_PAYMENT_DAYS.search(c2_text)
                if c1_pay_match and c2_pay_match:
                    days_1 = int(c1_pay_match.group(1))
                    days_2 = int(c2_pay_match.group(1))
                    if days_1 != days_2:
                        findings.append(
                            CrossClauseFinding(
                                id=uuid4(),
                                issue_type=CrossClauseIssueType.CONTRADICTION,
                                severity=RiskLevel.HIGH,
                                source_clause_id=c1.id,
                                source_clause_index=c1.clause_index,
                                target_clause_id=c2.id,
                                target_clause_index=c2.clause_index,
                                title=(
                                    f"Conflicting Payment Timelines "
                                    f"(Net {days_1} vs. Net {days_2} Days)"
                                ),
                                description=(
                                    f"Clause #{c1.clause_index + 1} stipulates Net {days_1} days, "
                                    f"whereas Clause #{c2.clause_index + 1} requires payment "
                                    f"within {days_2} days."
                                ),
                                recommended_fix=(
                                    f"Align payment terms across both provisions to a single "
                                    f"agreed deadline (e.g., Net {days_1} days)."
                                ),
                            )
                        )

                # Check 3: Notice & Cure vs Immediate Termination / Sole Remedy Waiver
                if c1_cure_match and _RE_IMMEDIATE_TERMINATION.search(c2_text):
                    cure_val = c1_cure_match.group(1)
                    findings.append(
                        CrossClauseFinding(
                            id=uuid4(),
                            issue_type=CrossClauseIssueType.CONTRADICTION,
                            severity=RiskLevel.HIGH,
                            source_clause_id=c1.id,
                            source_clause_index=c1.clause_index,
                            target_clause_id=c2.id,
                            target_clause_index=c2.clause_index,
                            title="Contradiction in Termination & Cure Rights",
                            description=(
                                f"Clause #{c1.clause_index + 1} grants a {cure_val} notice "
                                f"and cure period, while Clause #{c2.clause_index + 1} allows "
                                "immediate unilateral remedy waiver or cancellation."
                            ),
                            recommended_fix=(
                                f"Clarify that remedies under Section {c2.clause_index + 1} "
                                "remain subject to the cure period in "
                                f"Clause #{c1.clause_index + 1}."
                            ),
                        )
                    )

                # Check 4: Confidentiality Protection vs AI Foundation Model Training
                if c1_conf_match and _RE_AI_TRAINING_PERMITTED.search(c2_text):
                    findings.append(
                        CrossClauseFinding(
                            id=uuid4(),
                            issue_type=CrossClauseIssueType.CONTRADICTION,
                            severity=RiskLevel.HIGH,
                            source_clause_id=c1.id,
                            source_clause_index=c1.clause_index,
                            target_clause_id=c2.id,
                            target_clause_index=c2.clause_index,
                            title="Contradiction in Customer Confidential Data & AI Model Training",
                            description=(
                                f"Clause #{c1.clause_index + 1} protects Customer data "
                                f"confidentiality, while Clause #{c2.clause_index + 1} permits "
                                "training AI models on customer inputs."
                            ),
                            recommended_fix=(
                                "Explicitly carve out Customer Confidential Information from any "
                                "AI model training or commercial data reuse."
                            ),
                        )
                    )

        # ------------------------------------------------------------------
        # Pass 4: Broken Section References
        # ------------------------------------------------------------------
        for c in clauses:
            for match in _RE_SECTION_REF.finditer(c.current_text):
                ref_num = match.group(1)
                # Check if ref_num exists in known_sections
                if ref_num not in known_sections:
                    findings.append(
                        CrossClauseFinding(
                            id=uuid4(),
                            issue_type=CrossClauseIssueType.BROKEN_REFERENCE,
                            severity=RiskLevel.HIGH,
                            source_clause_id=c.id,
                            source_clause_index=c.clause_index,
                            target_clause_id=None,
                            target_clause_index=None,
                            title=f"Dangling Reference to Section {ref_num}",
                            description=(
                                f"Clause #{c.clause_index + 1} references Section {ref_num}, "
                                "which does not exist anywhere in the contract structure."
                            ),
                            recommended_fix=(
                                f"Update citation to refer to an active section or restore the "
                                f"missing Section {ref_num} provision."
                            ),
                        )
                    )

        # ------------------------------------------------------------------
        # Pass 5: Undefined Specialized Terms
        # ------------------------------------------------------------------
        for c in clauses:
            for specialized_term in _SPECIALIZED_CANDIDATE_TERMS:
                term_lower = specialized_term.lower()
                if term_lower in c.current_text.lower() and term_lower not in defined_terms:
                    findings.append(
                        CrossClauseFinding(
                            id=uuid4(),
                            issue_type=CrossClauseIssueType.UNDEFINED_TERM,
                            severity=RiskLevel.MEDIUM,
                            source_clause_id=c.id,
                            source_clause_index=c.clause_index,
                            target_clause_id=None,
                            target_clause_index=None,
                            title=f"Undefined Capitalized Term: '{specialized_term}'",
                            description=(
                                f"Clause #{c.clause_index + 1} relies on specialized "
                                f"capitalized term '{specialized_term}' without definition."
                            ),
                            recommended_fix=(
                                f"Add a formal definition for '{specialized_term}' in Section 1 "
                                "to avoid ambiguity during contractual dispute resolution."
                            ),
                        )
                    )

        # Remove duplicate findings for the same issue_type on the same clause
        unique_findings: list[CrossClauseFinding] = []
        seen_keys: set[tuple[str, UUID, UUID | None, str]] = set()
        for f in findings:
            key = (f.issue_type.value, f.source_clause_id, f.target_clause_id, f.title)
            if key not in seen_keys:
                seen_keys.add(key)
                unique_findings.append(f)

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        score = _compute_integrity_score(unique_findings)

        contradictions = sum(
            1 for f in unique_findings if f.issue_type == CrossClauseIssueType.CONTRADICTION
        )
        broken_refs = sum(
            1 for f in unique_findings if f.issue_type == CrossClauseIssueType.BROKEN_REFERENCE
        )
        undefined_terms = sum(
            1 for f in unique_findings if f.issue_type == CrossClauseIssueType.UNDEFINED_TERM
        )

        return CrossClauseAnalysisReport(
            document_id=document_id,
            total_findings=len(unique_findings),
            contradiction_count=contradictions,
            broken_reference_count=broken_refs,
            undefined_term_count=undefined_terms,
            integrity_score=score,
            findings=unique_findings,
            execution_time_ms=elapsed_ms,
        )


__all__ = [
    "LangChainCrossClauseAnalyzer",
]
