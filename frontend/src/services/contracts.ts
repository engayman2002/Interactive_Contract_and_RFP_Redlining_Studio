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

export const VerificationStatusSchema = z.enum([
  "VERIFIED",
  "AUTO_REFINED",
  "NEEDS_HUMAN_REVIEW",
]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const PushbackSeveritySchema = z.enum([
  "LOW",
  "MODERATE",
  "HIGH",
  "DEALBREAKER",
]);
export type PushbackSeverity = z.infer<typeof PushbackSeveritySchema>;

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
  confidence_score: z.number().int().min(0).max(100).optional(),
  verification_status: VerificationStatusSchema.optional(),
  critic_notes: z.string().optional(),
  policy_alignment_passed: z.boolean().optional(),
  hallucination_free_passed: z.boolean().optional(),
  obligation_preservation_passed: z.boolean().optional(),
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

export const NegotiationStanceSchema = z.enum([
  "strict",
  "balanced",
  "commercial",
]);
export type NegotiationStance = z.infer<typeof NegotiationStanceSchema>;

export const AnalyzeDocumentRequestDTOSchema = z.object({
  stance: NegotiationStanceSchema.default("balanced"),
});
export type AnalyzeDocumentRequestDTO = z.infer<
  typeof AnalyzeDocumentRequestDTOSchema
>;

export const AuditActionSchema = z.enum([
  "DOCUMENT_INGESTED",
  "DOCUMENT_ANALYZED",
  "SUGGESTION_ACCEPTED",
  "SUGGESTION_MODIFIED",
  "SUGGESTION_REJECTED",
  "SUGGESTION_REFINED",
  "SUGGESTION_VERIFIED",
  "PUSHBACK_SIMULATED",
  "COMMENT_CREATED",
  "DOCUMENT_EXPORTED",
  "CROSS_CLAUSE_CHECKED",
]);
export type AuditAction = z.infer<typeof AuditActionSchema>;

export const CrossClauseIssueTypeSchema = z.enum([
  "CONTRADICTION",
  "BROKEN_REFERENCE",
  "UNDEFINED_TERM",
]);
export type CrossClauseIssueType = z.infer<typeof CrossClauseIssueTypeSchema>;

export const CrossClauseFindingDTOSchema = z.object({
  id: z.string(),
  issue_type: CrossClauseIssueTypeSchema,
  severity: RiskLevelSchema,
  source_clause_id: z.string(),
  source_clause_index: z.number().int().nonnegative(),
  target_clause_id: z.string().nullable().optional(),
  target_clause_index: z.number().int().nonnegative().nullable().optional(),
  title: z.string(),
  description: z.string(),
  recommended_fix: z.string(),
});
export type CrossClauseFindingDTO = z.infer<typeof CrossClauseFindingDTOSchema>;

export const CrossClauseAnalysisReportDTOSchema = z.object({
  document_id: z.string(),
  total_findings: z.number().int().nonnegative(),
  contradiction_count: z.number().int().nonnegative(),
  broken_reference_count: z.number().int().nonnegative(),
  undefined_term_count: z.number().int().nonnegative(),
  integrity_score: z.number().int().min(0).max(100),
  findings: z.array(CrossClauseFindingDTOSchema),
  execution_time_ms: z.number(),
});
export type CrossClauseAnalysisReportDTO = z.infer<
  typeof CrossClauseAnalysisReportDTOSchema
>;

export const RefineSuggestionRequestDTOSchema = z.object({
  instruction: z.string().min(3).max(1000),
  stance: NegotiationStanceSchema.default("balanced"),
});
export type RefineSuggestionRequestDTO = z.infer<
  typeof RefineSuggestionRequestDTOSchema
>;

export const RefineSuggestionResponseDTOSchema = z.object({
  suggestion: RedlineSuggestionDTOSchema,
  negotiation_talking_point: z.string(),
  latency_ms: z.number(),
});
export type RefineSuggestionResponseDTO = z.infer<
  typeof RefineSuggestionResponseDTOSchema
>;

export const VerifySuggestionResponseDTOSchema = z.object({
  suggestion: RedlineSuggestionDTOSchema,
  verification_status: VerificationStatusSchema,
  confidence_score: z.number().int().min(0).max(100),
  policy_alignment_passed: z.boolean(),
  hallucination_free_passed: z.boolean(),
  obligation_preservation_passed: z.boolean(),
  auto_corrected: z.boolean(),
  critic_notes: z.string(),
  latency_ms: z.number(),
});
export type VerifySuggestionResponseDTO = z.infer<
  typeof VerifySuggestionResponseDTOSchema
>;

export const SimulatePushbackRequestDTOSchema = z.object({
  stance: NegotiationStanceSchema.default("balanced"),
});
export type SimulatePushbackRequestDTO = z.infer<
  typeof SimulatePushbackRequestDTOSchema
>;

export const SimulatePushbackResponseDTOSchema = z.object({
  suggestion_id: z.string(),
  clause_id: z.string(),
  acceptance_probability: z.number().int().min(0).max(100),
  pushback_severity: PushbackSeveritySchema,
  counterparty_persona: z.string(),
  expected_objection: z.string(),
  rebuttal_talking_point: z.string(),
  fallback_compromise_text: z.string(),
  latency_ms: z.number(),
});
export type SimulatePushbackResponseDTO = z.infer<
  typeof SimulatePushbackResponseDTOSchema
>;

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
  stance: NegotiationStanceSchema.default("balanced"),
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
  stance: NegotiationStanceSchema.optional(),
  confidence_score: z.number().int().min(0).max(100).optional(),
  verification_status: VerificationStatusSchema.optional(),
  critic_notes: z.string().optional(),
  policy_alignment_passed: z.boolean().optional(),
  hallucination_free_passed: z.boolean().optional(),
  obligation_preservation_passed: z.boolean().optional(),
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

export const ProviderCatalogItemDTOSchema = z.object({
  provider_id: z.string(),
  display_name: z.string(),
  supports_llm: z.boolean(),
  supports_embeddings: z.boolean(),
  requires_api_key: z.boolean(),
  supports_base_url: z.boolean(),
  default_llm_model: z.string().nullable().optional(),
  recommended_llm_models: z.array(z.string()).default([]),
  default_embedding_model: z.string().nullable().optional(),
  recommended_embedding_models: z.array(z.string()).default([]),
});
export type ProviderCatalogItemDTO = z.infer<
  typeof ProviderCatalogItemDTOSchema
>;

export const AISettingsResponseDTOSchema = z.object({
  llm_provider: z.string(),
  llm_model_name: z.string(),
  llm_base_url: z.string().nullable().optional(),
  llm_has_api_key: z.boolean(),
  llm_api_key_masked: z.string().nullable().optional(),
  llm_temperature: z.number(),
  embedding_provider: z.string(),
  embedding_model_name: z.string(),
  embedding_base_url: z.string().nullable().optional(),
  embedding_has_api_key: z.boolean(),
  embedding_api_key_masked: z.string().nullable().optional(),
  available_providers: z.array(ProviderCatalogItemDTOSchema).default([]),
});
export type AISettingsResponseDTO = z.infer<typeof AISettingsResponseDTOSchema>;

export const UpdateAISettingsRequestDTOSchema = z.object({
  llm_provider: z.string().optional(),
  llm_model_name: z.string().optional(),
  llm_base_url: z.string().nullable().optional(),
  llm_api_key: z.string().nullable().optional(),
  llm_temperature: z.number().min(0).max(1).optional(),
  embedding_provider: z.string().optional(),
  embedding_model_name: z.string().optional(),
  embedding_base_url: z.string().nullable().optional(),
  embedding_api_key: z.string().nullable().optional(),
});
export type UpdateAISettingsRequestDTO = z.infer<
  typeof UpdateAISettingsRequestDTOSchema
>;

export const TestAIConnectionTargetSchema = z.enum([
  "llm",
  "embedding",
  "both",
]);
export type TestAIConnectionTarget = z.infer<
  typeof TestAIConnectionTargetSchema
>;

export const TestAIConnectionRequestDTOSchema = z.object({
  target: TestAIConnectionTargetSchema.default("both"),
  llm_provider: z.string().optional(),
  llm_model_name: z.string().optional(),
  llm_base_url: z.string().nullable().optional(),
  llm_api_key: z.string().nullable().optional(),
  llm_temperature: z.number().min(0).max(1).optional(),
  embedding_provider: z.string().optional(),
  embedding_model_name: z.string().optional(),
  embedding_base_url: z.string().nullable().optional(),
  embedding_api_key: z.string().nullable().optional(),
});
export type TestAIConnectionRequestDTO = z.infer<
  typeof TestAIConnectionRequestDTOSchema
>;

export const TestAIConnectionResponseDTOSchema = z.object({
  success: z.boolean(),
  llm_ok: z.boolean().nullable().optional(),
  embedding_ok: z.boolean().nullable().optional(),
  latency_ms: z.number(),
  provider_tested: z.string(),
  model_tested: z.string(),
  message: z.string(),
  sample_output_preview: z.string().nullable().optional(),
});
export type TestAIConnectionResponseDTO = z.infer<
  typeof TestAIConnectionResponseDTOSchema
>;

export const DiscoverModelsSourceSchema = z.enum([
  "live_api",
  "unconfigured",
  "unreachable",
]);
export type DiscoverModelsSource = z.infer<typeof DiscoverModelsSourceSchema>;

export const DiscoverModelsRequestDTOSchema = z.object({
  provider_id: z.string().min(1),
  api_key: z.string().nullable().optional(),
  base_url: z.string().nullable().optional(),
});
export type DiscoverModelsRequestDTO = z.infer<
  typeof DiscoverModelsRequestDTOSchema
>;

export const DiscoverModelsResponseDTOSchema = z.object({
  provider_id: z.string(),
  source: DiscoverModelsSourceSchema,
  llm_models: z.array(z.string()).default([]),
  embedding_models: z.array(z.string()).default([]),
  latency_ms: z.number(),
  message: z.string(),
});
export type DiscoverModelsResponseDTO = z.infer<
  typeof DiscoverModelsResponseDTOSchema
>;

export const EncryptedAIVaultEnvelopeDTOSchema = z.object({
  vault_version: z.literal(1).default(1),
  kdf: z.literal("PBKDF2-HMAC-SHA256").default("PBKDF2-HMAC-SHA256"),
  iterations: z.number().int().min(100000).max(2000000).default(600000),
  cipher: z.literal("AES-256-GCM").default("AES-256-GCM"),
  salt_b64: z.string().min(16),
  nonce_b64: z.string().min(12),
  ciphertext_b64: z.string().min(24),
  exported_at: z.string().min(10),
});
export type EncryptedAIVaultEnvelopeDTO = z.infer<
  typeof EncryptedAIVaultEnvelopeDTOSchema
>;

export const ExportAIVaultRequestDTOSchema = z.object({
  passphrase: z.string().min(8).max(256),
  llm_provider: z.string().optional(),
  llm_model_name: z.string().optional(),
  llm_base_url: z.string().nullable().optional(),
  llm_api_key: z.string().nullable().optional(),
  llm_temperature: z.number().min(0).max(1).optional(),
  embedding_provider: z.string().optional(),
  embedding_model_name: z.string().optional(),
  embedding_base_url: z.string().nullable().optional(),
  embedding_api_key: z.string().nullable().optional(),
});
export type ExportAIVaultRequestDTO = z.infer<
  typeof ExportAIVaultRequestDTOSchema
>;

export const ImportAIVaultRequestDTOSchema = z.object({
  passphrase: z.string().min(8).max(256),
  vault: EncryptedAIVaultEnvelopeDTOSchema,
});
export type ImportAIVaultRequestDTO = z.infer<
  typeof ImportAIVaultRequestDTOSchema
>;



