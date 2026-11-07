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

export const ExportModeSchema = z.enum(["track_changes", "clean"]);
export type ExportMode = z.infer<typeof ExportModeSchema>;

export const AuditActionSchema = z.enum([
  "DOCUMENT_INGESTED",
  "DOCUMENT_ANALYZED",
  "SUGGESTION_ACCEPTED",
  "SUGGESTION_MODIFIED",
  "SUGGESTION_REJECTED",
  "COMMENT_CREATED",
  "DOCUMENT_EXPORTED",
]);
export type AuditAction = z.infer<typeof AuditActionSchema>;

export const AuditLogEntryDTOSchema = z.object({
  id: z.string(),
  org_id: z.string(),
  document_id: z.string(),
  clause_id: z.string().nullable().optional(),
  actor_user_id: z.string(),
  actor_role: z.string(),
  action: AuditActionSchema,
  details: z.record(z.union([z.string(), z.number(), z.null()])).default({}),
  created_at: z.string(),
});
export type AuditLogEntryDTO = z.infer<typeof AuditLogEntryDTOSchema>;

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
  audit_logs: z.array(AuditLogEntryDTOSchema).default([]),
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

export const PlaybookRuleDTOSchema = z.object({
  id: z.string(),
  org_id: z.string(),
  category: z.string(),
  standard_position: z.string(),
  fallback_position: z.string(),
  unacceptable_triggers: z.string(),
  embedding_dim: z.number().int().optional(),
});
export type PlaybookRuleDTO = z.infer<typeof PlaybookRuleDTOSchema>;

export const CreatePlaybookRuleRequestDTOSchema = z.object({
  category: z.string().min(1),
  standard_position: z.string().min(1),
  fallback_position: z.string().min(1),
  unacceptable_triggers: z.string().min(1),
});
export type CreatePlaybookRuleRequestDTO = z.infer<
  typeof CreatePlaybookRuleRequestDTOSchema
>;

export const DocumentListItemDTOSchema = z.object({
  id: z.string(),
  org_id: z.string(),
  title: z.string(),
  status: z.string(),
  version: z.number().int().positive(),
  created_by: z.string(),
  created_at: z.string(),
  clause_count: z.number().int().optional(),
});
export type DocumentListItemDTO = z.infer<typeof DocumentListItemDTOSchema>;

export const UserResponseDTOSchema = z.object({
  id: z.string(),
  org_id: z.string(),
  email: z.string(),
  role: z.string(),
  created_at: z.string(),
});
export type UserResponseDTO = z.infer<typeof UserResponseDTOSchema>;

export const TokenResponseDTOSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number().int().optional(),
  user: UserResponseDTOSchema.optional(),
});
export type TokenResponseDTO = z.infer<typeof TokenResponseDTOSchema>;

export const OnboardingResponseDTOSchema = z.object({
  organization: z.object({
    id: z.string(),
    name: z.string(),
    created_at: z.string(),
  }),
  admin_user: UserResponseDTOSchema,
  access_token: z.string(),
  token_type: z.string(),
});
export type OnboardingResponseDTO = z.infer<typeof OnboardingResponseDTOSchema>;


