import { z } from "zod";

export const RiskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const SuggestionStatusSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "MODIFIED",
]);
export type SuggestionStatus = z.infer<typeof SuggestionStatusSchema>;

export const ClauseDTOSchema = z.object({
  id: z.string(),
  document_id: z.string(),
  clause_index: z.number().int().nonnegative(),
  heading: z.string().nullable().optional(),
  original_text: z.string(),
  current_text: z.string(),
  version: z.number().int().positive(),
});
export type ClauseDTO = z.infer<typeof ClauseDTOSchema>;

export const RedlineSuggestionDTOSchema = z.object({
  id: z.string(),
  clause_id: z.string(),
  matched_rule_id: z.string().nullable().optional(),
  risk: RiskLevelSchema,
  proposed_text: z.string(),
  rationale: z.string(),
  status: SuggestionStatusSchema,
  resolved_by: z.string().nullable().optional(),
  resolved_at: z.string().nullable().optional(),
  created_at: z.string(),
});
export type RedlineSuggestionDTO = z.infer<typeof RedlineSuggestionDTOSchema>;

export const ClauseCommentDTOSchema = z.object({
  id: z.string(),
  clause_id: z.string(),
  author_id: z.string(),
  body: z.string(),
  created_at: z.string(),
});
export type ClauseCommentDTO = z.infer<typeof ClauseCommentDTOSchema>;

export const DocumentMetadataDTOSchema = z.object({
  id: z.string(),
  org_id: z.string(),
  title: z.string(),
  status: z.string(),
  version: z.number().int().positive(),
  created_by: z.string(),
  created_at: z.string(),
});
export type DocumentMetadataDTO = z.infer<typeof DocumentMetadataDTOSchema>;

export const DocumentWorkspaceDTOSchema = z.object({
  document_id: z.string(),
  org_id: z.string(),
  title: z.string(),
  status: z.string(),
  version: z.number().int().positive(),
  created_by: z.string(),
  created_at: z.string(),
  document: DocumentMetadataDTOSchema.optional(),
  clauses: z.array(ClauseDTOSchema),
  redlines: z.array(RedlineSuggestionDTOSchema),
  comments: z.array(ClauseCommentDTOSchema).default([]),
});
export type DocumentWorkspaceDTO = z.infer<typeof DocumentWorkspaceDTOSchema>;

export const DocumentAnalysisSummaryDTOSchema = z.object({
  document_id: z.string(),
  status: z.string(),
  total_clauses: z.number().int(),
  suggestions_created: z.number().int(),
  critical_count: z.number().int(),
  high_count: z.number().int(),
  medium_count: z.number().int(),
  low_count: z.number().int(),
  compliant_count: z.number().int(),
  execution_time_ms: z.number(),
});
export type DocumentAnalysisSummaryDTO = z.infer<
  typeof DocumentAnalysisSummaryDTOSchema
>;

export const AuditProgressEventDTOSchema = z.object({
  event_type: z.enum(["clause_audited", "completed", "error"]),
  document_id: z.string(),
  clause_id: z.string().nullable(),
  clause_index: z.number().int().nullable(),
  completed_count: z.number().int(),
  total_count: z.number().int(),
  risk: RiskLevelSchema.nullable(),
  status: z.string(),
  is_compliant: z.boolean().optional(),
  category: z.string().optional(),
  matched_rule_id: z.string().nullable().optional(),
  proposed_text: z.string().optional(),
  rationale: z.string().optional(),
});
export type AuditProgressEventDTO = z.infer<typeof AuditProgressEventDTOSchema>;

export const ResolutionActionSchema = z.enum(["ACCEPT", "REJECT", "MODIFY"]);
export type ResolutionAction = z.infer<typeof ResolutionActionSchema>;

export const ResolveSuggestionRequestDTOSchema = z.object({
  action: ResolutionActionSchema,
  expected_clause_version: z.number().int().positive(),
  modified_text: z.string().nullable().optional(),
});
export type ResolveSuggestionRequestDTO = z.infer<
  typeof ResolveSuggestionRequestDTOSchema
>;

export const ResolveSuggestionResponseDTOSchema = z.object({
  suggestion: RedlineSuggestionDTOSchema,
  clause: ClauseDTOSchema,
  document_version: z.number().int().positive(),
});
export type ResolveSuggestionResponseDTO = z.infer<
  typeof ResolveSuggestionResponseDTOSchema
>;

export const CreateClauseCommentRequestDTOSchema = z.object({
  body: z.string().min(1),
});
export type CreateClauseCommentRequestDTO = z.infer<
  typeof CreateClauseCommentRequestDTOSchema
>;

