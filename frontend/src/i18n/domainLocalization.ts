import type { SupportedLocale } from "@/i18n/translations";
import type {
  AuditAction,
  ClauseDTO,
  CrossClauseFindingDTO,
  CrossClauseIssueType,
  ExtractedPlaybookRuleCandidateDTO,
  NegotiationStance,
  PlaybookRuleDTO,
  PushbackSeverity,
  RedlineSuggestionDTO,
  RiskLevel,
  SimulatePushbackResponseDTO,
  SuggestionStatus,
} from "@/services/contracts";

export function localizeRiskLabel(
  risk: RiskLevel | "COMPLIANT",
  locale: SupportedLocale
): string {
  if (locale === "en") {
    return risk;
  }
  const map: Record<SupportedLocale, Record<RiskLevel | "COMPLIANT", string>> = {
    en: {
      CRITICAL: "CRITICAL",
      HIGH: "HIGH",
      MEDIUM: "MEDIUM",
      LOW: "LOW",
      COMPLIANT: "COMPLIANT",
    },
    es: {
      CRITICAL: "CRÍTICO",
      HIGH: "ALTO",
      MEDIUM: "MEDIO",
      LOW: "BAJO",
      COMPLIANT: "CONFORME",
    },
    fr: {
      CRITICAL: "CRITIQUE",
      HIGH: "ÉLEVÉ",
      MEDIUM: "MOYEN",
      LOW: "FAIBLE",
      COMPLIANT: "CONFORME",
    },
  };
  return map[locale][risk] ?? risk;
}

export function localizeSuggestionStatus(
  status: SuggestionStatus,
  locale: SupportedLocale
): string {
  if (locale === "en") {
    return status;
  }
  const map: Record<SupportedLocale, Record<SuggestionStatus, string>> = {
    en: {
      PENDING: "PENDING",
      ACCEPTED: "ACCEPTED",
      MODIFIED: "MODIFIED",
      REJECTED: "REJECTED",
    },
    es: {
      PENDING: "PENDIENTE",
      ACCEPTED: "ACEPTADO",
      MODIFIED: "MODIFICADO",
      REJECTED: "RECHAZADO",
    },
    fr: {
      PENDING: "EN ATTENTE",
      ACCEPTED: "ACCEPTÉ",
      MODIFIED: "MODIFIÉ",
      REJECTED: "REJETÉ",
    },
  };
  return map[locale][status] ?? status;
}

export function localizePushbackSeverityBadge(
  severity: PushbackSeverity,
  locale: SupportedLocale
): string {
  if (locale === "en") {
    return `${severity} PUSHBACK`;
  }
  const map: Record<SupportedLocale, Record<PushbackSeverity, string>> = {
    en: {
      LOW: "LOW PUSHBACK",
      MODERATE: "MODERATE PUSHBACK",
      HIGH: "HIGH PUSHBACK",
      DEALBREAKER: "DEALBREAKER PUSHBACK",
    },
    es: {
      LOW: "OBJECIÓN BAJA",
      MODERATE: "OBJECIÓN MODERADA",
      HIGH: "OBJECIÓN ALTA",
      DEALBREAKER: "OBJECIÓN BLOQUEANTE",
    },
    fr: {
      LOW: "OBJECTION FAIBLE",
      MODERATE: "OBJECTION MODÉRÉE",
      HIGH: "OBJECTION ÉLEVÉE",
      DEALBREAKER: "OBJECTION BLOQUANTE",
    },
  };
  return map[locale][severity] ?? `${severity}`;
}

export function localizeDocumentStatus(
  status: string,
  locale: SupportedLocale
): string {
  if (locale === "en") {
    return status;
  }
  const upper = status.toUpperCase();
  if (locale === "es") {
    if (upper === "ANALYZED") return "ANALIZADO";
    if (upper === "READY") return "LISTO";
    if (upper === "INGESTED") return "INGESTIONADO";
    if (upper === "PROCESSING") return "PROCESANDO";
    return status;
  }
  if (upper === "ANALYZED") return "ANALYSÉ";
  if (upper === "READY") return "PRÊT";
  if (upper === "INGESTED") return "INTÉGRÉ";
  if (upper === "PROCESSING") return "EN COURS";
  return status;
}

export function localizeNegotiationStance(
  stance: NegotiationStance,
  locale: SupportedLocale
): string {
  if (locale === "en") {
    return stance;
  }
  const map: Record<SupportedLocale, Record<NegotiationStance, string>> = {
    en: {
      strict: "strict",
      balanced: "balanced",
      commercial: "commercial",
    },
    es: {
      strict: "Estricto",
      balanced: "Equilibrado",
      commercial: "Comercial",
    },
    fr: {
      strict: "Strict",
      balanced: "Équilibré",
      commercial: "Commercial",
    },
  };
  return map[locale][stance] ?? stance;
}

export function localizeDemoDocumentTitle(
  title: string,
  locale: SupportedLocale
): string {
  if (locale === "en") {
    return title;
  }
  const exactMap: Record<string, Record<"es" | "fr", string>> = {
    "Master Cloud Infrastructure & Enterprise AI Services Agreement": {
      es: "Contrato Marco de Infraestructura Cloud y Servicios de IA Empresarial",
      fr: "Contrat-Cadre d'Infrastructure Cloud et de Services d'IA d'Entreprise",
    },
    "Master Commercial Agreement — Review Copy": {
      es: "Contrato Marco Comercial — Copia de Revisión",
      fr: "Contrat-Cadre Commercial — Copie de Révision",
    },
    "SaaS Enterprise Subscription Agreement (v2)": {
      es: "Contrato de Suscripción Empresarial SaaS (v2)",
      fr: "Contrat d'Abonnement SaaS Entreprise (v2)",
    },
    "Enterprise RFP Compliance Addendum": {
      es: "Anexo de Cumplimiento para Licitación Empresarial (RFP)",
      fr: "Addendum de Conformité Appel d'Offres Entreprise (RFP)",
    },
  };
  return exactMap[title]?.[locale] ?? title;
}

interface LocalizedClauseContent {
  heading: string;
  originalText: string;
}

const DEMO_CLAUSE_TRANSLATIONS: Record<
  string,
  Record<"es" | "fr", LocalizedClauseContent>
> = {
  "c0000000-0000-4000-8000-000000000101": {
    es: {
      heading: "1. Limitación de Responsabilidad",
      originalText:
        "En ningún caso la responsabilidad acumulada total del Proveedor bajo el presente Contrato excederá quinientos dólares ($500), incluyendo incumplimientos de confidencialidad y propiedad intelectual. El Cliente asume todos los daños indirectos, incidentales y consecuentes derivados de interrupciones del servicio.",
    },
    fr: {
      heading: "1. Limitation de Responsabilité",
      originalText:
        "En aucun cas la responsabilité cumulée totale du Fournisseur au titre du présent Contrat n'excédera cinq cents dollars (500 $), y compris en cas de violation de confidentialité ou de propriété intellectuelle. Le Client supporte l'intégralité des dommages indirects, accessoires et consécutifs liés aux interruptions de service.",
    },
  },
  "c0000000-0000-4000-8000-000000000102": {
    es: {
      heading: "2. Indemnización",
      originalText:
        "El Cliente defenderá, indemnizará y mantendrá indemne al Proveedor frente a cualquier reclamación, pérdida y costo de terceros que surja del uso de la Plataforma por el Cliente o de reclamaciones causadas por negligencia grave del Proveedor.",
    },
    fr: {
      heading: "2. Indemnisation",
      originalText:
        "Le Client défendra, indemnisera et dégagera de toute responsabilité le Fournisseur contre toute réclamation, perte et dépense de tiers découlant de l'utilisation de la Plateforme par le Client ou de réclamations causées par la négligence grave du Fournisseur.",
    },
  },
  "c0000000-0000-4000-8000-000000000103": {
    es: {
      heading: "3. Acuerdo de Nivel de Servicio (SLA)",
      originalText:
        "El Proveedor realizará esfuerzos comercialmente razonables para mantener un 95,0% de disponibilidad mensual de la plataforma. Los créditos de servicio quedan a entera discreción del Proveedor sin derecho de rescisión anticipada por fallos crónicos del SLA.",
    },
    fr: {
      heading: "3. Accord de Niveau de Service (SLA)",
      originalText:
        "Le Fournisseur déploiera des efforts commercialement raisonnables pour maintenir une disponibilité mensuelle de 95,0 % de la plateforme. Les crédits de service restent à la seule discrétion du Fournisseur sans droit de résiliation pour manquements chroniques au SLA.",
    },
  },
  "c0000000-0000-4000-8000-000000000104": {
    es: {
      heading: "4. Privacidad de Datos y Entrenamiento de IA",
      originalText:
        "El Proveedor podrá conservar una licencia perpetua e irrevocable para utilizar todos los Datos del Cliente e Información Confidencial cargada con el fin de entrenar modelos fundacionales de IA públicos y de terceros.",
    },
    fr: {
      heading: "4. Confidentialité des Données et Entraînement d'IA",
      originalText:
        "Le Fournisseur peut conserver une licence perpétuelle et irrévocable d'utiliser l'ensemble des Données Client et Informations Confidentielles importées afin d'entraîner des modèles de fondation d'IA publics et tiers.",
    },
  },
  "c0000000-0000-4000-8000-000000000105": {
    es: {
      heading: "5. Condiciones de Pago y Facturación",
      originalText:
        "Todas las facturas vencen y son pagaderas dentro de los siete (7) días siguientes a su emisión sin derecho a impugnación. El Proveedor podrá suspender inmediatamente los servicios en producción sin preaviso por cualquier retraso en el pago.",
    },
    fr: {
      heading: "5. Conditions de Paiement et de Facturation",
      originalText:
        "Toutes les factures sont exigibles et payables sous sept (7) jours à compter de leur émission sans droit de contestation. Le Fournisseur peut suspendre immédiatement les services de production sans préavis en cas de retard de paiement.",
    },
  },
  "c0000000-0000-4000-8000-000000000106": {
    es: {
      heading: "6. Legislación Aplicable y Cumplimiento",
      originalText:
        "El presente Contrato se regirá por las leyes del Estado de Delaware sin atender a sus normas sobre conflicto de leyes. Ambas partes cumplirán íntegramente con las leyes anticorrupción y de control de exportaciones aplicables.",
    },
    fr: {
      heading: "6. Droit Applicable et Conformité",
      originalText:
        "Le présent Contrat est régi par les lois de l'État du Delaware, sans égard aux principes de conflit de lois. Chaque partie se conformera strictement aux réglementations applicables en matière de lutte contre la corruption et de contrôle des exportations.",
    },
  },
};

interface LocalizedRedlineContent {
  proposedText: string;
  rationale: string;
  criticNotes: string;
}

const DEMO_REDLINE_TRANSLATIONS: Record<
  string,
  Record<"es" | "fr", LocalizedRedlineContent>
> = {
  "r0000000-0000-4000-8000-000000000201": {
    es: {
      proposedText:
        "Salvo en caso de incumplimiento de obligaciones de confidencialidad o indemnización por propiedad intelectual, la responsabilidad acumulada total de cualquiera de las partes bajo este Contrato no excederá el total de las tarifas pagadas o pagaderas por el Cliente en los doce (12) meses inmediatamente anteriores a la reclamación. Ninguna de las partes será responsable por daños indirectos, incidentales, especiales o consecuentes.",
      rationale:
        "Un límite unilateral de $500 traslada una exposición financiera catastrófica al Cliente y contradice directamente el estándar del Playbook corporativo. | Argumento: Los contratos SaaS empresariales exigen paridad mutua de responsabilidad equivalente a 12 meses de tarifas con exclusiones estándar de daños consecuentes.",
      criticNotes:
        "Critic Guard: Política del Playbook verificada (límite mutuo de 12 meses). Cero alucinaciones detectadas y exclusión recíproca de daños consecuentes preservada.",
    },
    fr: {
      proposedText:
        "Sous réserve des manquements aux obligations de confidentialité ou d'indemnisation en matière de propriété intellectuelle, la responsabilité cumulée totale de chaque partie au titre du présent Contrat n'excédera pas le montant total des redevances payées ou dues par le Client au cours des douze (12) mois précédant immédiatement la réclamation. Aucune des parties ne sera responsable des dommages indirects, accessoires, spéciaux ou consécutifs.",
      rationale:
        "Un plafond unilatéral de 500 $ transfère un risque financier catastrophique au Client et enfreint directement le Playbook de l'entreprise. | Argumentaire : Les contrats SaaS d'entreprise exigent une parité mutuelle plafonnée à 12 mois de redevances avec exclusions réciproques des dommages consécutifs.",
      criticNotes:
        "Critic Guard : Alignement vérifié avec le Playbook (plafond mutuel 12 mois). Aucune hallucination détectée et préservation complète des obligations.",
    },
  },
  "r0000000-0000-4000-8000-000000000202": {
    es: {
      proposedText:
        "Cada parte defenderá, indemnizará y mantendrá indemne a la otra frente a reclamaciones de terceros por infracción de propiedad intelectual o negligencia grave atribuible a la parte indemnizante, sujeto a notificación oportuna por escrito y control razonable de la defensa.",
      rationale:
        "Es inaceptable que el Cliente indemnice al Proveedor por la propia negligencia grave del Proveedor. | Argumento: La indemnización debe ser recíproca y estrictamente proporcional a la culpa atribuible y a la titularidad de PI de cada parte.",
      criticNotes:
        "Critic Guard: Cláusula ajustada a indemnización mutua por culpa y PI conforme al Playbook corporativo.",
    },
    fr: {
      proposedText:
        "Chaque partie défendra, indemnisera et dégagera l'autre partie contre toute réclamation de tiers fondée sur une violation de propriété intellectuelle ou une négligence grave imputable à la partie indemnisante, sous réserve d'une notification écrite rapide et du contrôle raisonnable de la défense.",
      rationale:
        "Le Client ne peut indemniser le Fournisseur pour la propre négligence grave du Fournisseur. | Argumentaire : L'indemnisation doit rester strictement réciproque et proportionnelle à la faute et aux droits de propriété intellectuelle de chaque partie.",
      criticNotes:
        "Critic Guard : Clause réalignée sur une indemnisation mutuelle fondée sur la faute et la PI selon le Playbook.",
    },
  },
  "r0000000-0000-4000-8000-000000000203": {
    es: {
      proposedText:
        "El Proveedor garantiza un tiempo de disponibilidad mensual mínimo del 99,9% en producción (excluyendo mantenimiento programado con 48 horas de preaviso). Si la disponibilidad cae por debajo del 99,9%, el Cliente recibirá créditos de servicio escalonados de hasta el 25% de la tarifa mensual, más derecho de rescisión tras tres (3) meses consecutivos de incumplimiento.",
      rationale:
        "Una disponibilidad del 95,0% permite más de 36 horas de caída mensual sin penalización contractual. | Argumento: Las cargas de trabajo productivas requieren un SLA vinculante del 99,9% con créditos automáticos y derecho de salida ante fallos crónicos.",
      criticNotes:
        "Critic Guard: Garantía 99,9% SLA y mecanismo de créditos/rescisión validados sin introducir compromisos no autorizados.",
    },
    fr: {
      proposedText:
        "Le Fournisseur garantit une disponibilité mensuelle minimale de 99,9 % en production (hors maintenance planifiée avec préavis de 48 heures). En deçà de 99,9 %, le Client bénéficiera de crédits de service progressifs jusqu'à 25 % de la redevance mensuelle, assortis d'un droit de résiliation après trois (3) mois consécutifs de défaillance.",
      rationale:
        "Un SLA de 95,0 % autorise plus de 36 heures d'interruption mensuelle sans aucune garantie contraignante. | Argumentaire : Les environnements de production exigent un engagement de 99,9 % avec crédits automatiques et clause de sortie en cas d'échecs répétés.",
      criticNotes:
        "Critic Guard : Seuil de disponibilité 99,9 %, crédits progressifs et clause de résiliation validés selon le Playbook.",
    },
  },
  "r0000000-0000-4000-8000-000000000204": {
    es: {
      proposedText:
        "El Cliente conserva la titularidad exclusiva sobre todos los Datos del Cliente. El Proveedor mantendrá salvaguardas conforme al RGPD y CCPA, nunca utilizará Datos del Cliente o Información Confidencial para entrenar modelos fundacionales de IA públicos o de terceros, y notificará cualquier brecha de seguridad confirmada en un plazo máximo de 24 horas.",
      rationale:
        "Conceder licencia perpetua para entrenar modelos públicos de IA expone propiedad intelectual sensible del Cliente y viola políticas de privacidad empresariales. | Argumento: Los datos confidenciales del Cliente deben permanecer estrictamente aislados sin uso alguno en entrenamiento de modelos compartidos.",
      criticNotes:
        "Critic Guard: Prohibición absoluta de entrenamiento de modelos públicos y plazo obligatorio de notificación de 24 horas verificados.",
    },
    fr: {
      proposedText:
        "Le Client conserve la propriété exclusive de l'ensemble des Données Client. Le Fournisseur appliquera des garanties conformes au RGPD et au CCPA, n'utilisera jamais les Données Client ou Informations Confidentielles pour entraîner des modèles d'IA publics ou tiers, et notifiera toute violation de sécurité confirmée sous 24 heures.",
      rationale:
        "Accorder une licence perpétuelle d'entraînement IA expose la propriété intellectuelle du Client et contrevient aux exigences de gouvernance RGPD/IA. | Argumentaire : Les données du Client doivent rester strictement isolées avec interdiction formelle d'entraînement sur modèles partagés.",
      criticNotes:
        "Critic Guard : Interdiction d'entraînement IA tiers et obligation de notification sous 24 heures entièrement validées.",
    },
  },
  "r0000000-0000-4000-8000-000000000205": {
    es: {
      proposedText:
        "Las facturas no impugnadas serán pagaderas dentro de los treinta (30) días netos siguientes a su recepción correcta. El Cliente podrá retener de buena fe los importes en disputa mientras se resuelven, y el Proveedor deberá otorgar al menos treinta (30) días de preaviso por escrito y período de subsanación antes de suspender servicios.",
      rationale:
        "Un plazo de pago de 7 días sin derecho a impugnación y suspensión inmediata genera riesgo grave de interrupción operativa. | Argumento: El estándar corporativo exige pagos a 30 días netos, derecho de disputa de buena fe y un período de subsanación de 30 días.",
      criticNotes:
        "Critic Guard: Condiciones Net 30 y protección de subsanación de 30 días alineadas con la política financiera.",
    },
    fr: {
      proposedText:
        "Les factures non contestées sont payables sous trente (30) jours nets à compter de leur réception conforme. Le Client peut suspendre de bonne foi le paiement des montants contestés pendant leur résolution, et le Fournisseur doit accorder un préavis écrit et un délai de remédiation d'au moins trente (30) jours avant toute suspension.",
      rationale:
        "Un délai de paiement de 7 jours sans droit de contestation ni préavis expose la continuité d'activité à un risque critique. | Argumentaire : Les standards d'achat imposent un règlement Net 30, la rétention de bonne foi des montants litigieux et une remédiation de 30 jours.",
      criticNotes:
        "Critic Guard : Conditions Net 30 et préavis de remédiation de 30 jours validés sans divergence numérique.",
    },
  },
};

const HEADING_KEYWORD_TRANSLATIONS: Array<{
  match: RegExp;
  es: string;
  fr: string;
}> = [
  {
    match: /Limitation of Liability/i,
    es: "Limitación de Responsabilidad",
    fr: "Limitation de Responsabilité",
  },
  {
    match: /Indemnification/i,
    es: "Indemnización",
    fr: "Indemnisation",
  },
  {
    match: /Service Level Agreement\s*\(SLA\)/i,
    es: "Acuerdo de Nivel de Servicio (SLA)",
    fr: "Accord de Niveau de Service (SLA)",
  },
  {
    match: /Data Privacy\s*&\s*AI Model Training/i,
    es: "Privacidad de Datos y Entrenamiento de IA",
    fr: "Confidentialité des Données et Entraînement d'IA",
  },
  {
    match: /Payment\s*&\s*Invoicing Terms/i,
    es: "Condiciones de Pago y Facturación",
    fr: "Conditions de Paiement et de Facturation",
  },
  {
    match: /Governing Law\s*&\s*Compliance/i,
    es: "Legislación Aplicable y Cumplimiento",
    fr: "Droit Applicable et Conformité",
  },
  {
    match: /Governing Law\s*&\s*Dispute Resolution/i,
    es: "Legislación Aplicable y Resolución de Disputas",
    fr: "Droit Applicable et Règlement des Litiges",
  },
  {
    match: /Term\s*(?:&|and)\s*Termination/i,
    es: "Vigencia y Rescisión",
    fr: "Durée et Résiliation",
  },
];

export function localizeHeadingText(
  heading: string,
  locale: SupportedLocale
): string {
  if (locale === "en") {
    return heading;
  }
  for (const rule of HEADING_KEYWORD_TRANSLATIONS) {
    if (rule.match.test(heading)) {
      return heading.replace(rule.match, rule[locale]);
    }
  }
  return heading;
}

export function localizeClauseForDisplay(
  clause: ClauseDTO,
  locale: SupportedLocale,
  matchingSuggestion?: RedlineSuggestionDTO
): ClauseDTO {
  if (locale === "en") {
    return clause;
  }
  const demoEntry = DEMO_CLAUSE_TRANSLATIONS[clause.id]?.[locale];
  if (!demoEntry) {
    return clause.heading
      ? { ...clause, heading: localizeHeadingText(clause.heading, locale) }
      : clause;
  }

  const demoRedlineEntry = matchingSuggestion
    ? DEMO_REDLINE_TRANSLATIONS[matchingSuggestion.id]?.[locale]
    : undefined;

  let localizedCurrentText = clause.current_text;
  if (clause.current_text === clause.original_text) {
    localizedCurrentText = demoEntry.originalText;
  } else if (
    matchingSuggestion &&
    demoRedlineEntry &&
    clause.current_text === matchingSuggestion.proposed_text
  ) {
    localizedCurrentText = demoRedlineEntry.proposedText;
  }

  return {
    ...clause,
    heading: demoEntry.heading,
    original_text: demoEntry.originalText,
    current_text: localizedCurrentText,
  };
}

function translateGenericRedlineStrings(
  text: string,
  locale: "es" | "fr"
): string {
  let out = text;
  if (locale === "es") {
    out = out
      .replace(/\[Strict Protective Stance\]/g, "[Postura Protectora Estricta]")
      .replace(/\[Balanced Mutual Stance\]/g, "[Postura Mutua Equilibrada]")
      .replace(/\[Commercial Fast-Close Stance\]/g, "[Postura Comercial Ágil]")
      .replace(/\s*\|\s*Talking Point:\s*/g, " | Argumento: ")
      .replace(/\[Auto-Refined by Critic\]/g, "[Refinado Automáticamente por Critic]")
      .replace(/\[Copilot AI Refined\]/g, "[Refinado con Copiloto IA]");
  } else {
    out = out
      .replace(/\[Strict Protective Stance\]/g, "[Posture Protectrice Stricte]")
      .replace(/\[Balanced Mutual Stance\]/g, "[Posture Mutuelle Équilibrée]")
      .replace(/\[Commercial Fast-Close Stance\]/g, "[Posture Commerciale Rapide]")
      .replace(/\s*\|\s*Talking Point:\s*/g, " | Argumentaire : ")
      .replace(/\[Auto-Refined by Critic\]/g, "[Affiné Automatiquement par Critic]")
      .replace(/\[Copilot AI Refined\]/g, "[Affiné par Copilote IA]");
  }
  return out;
}

export function localizeCriticNotesText(
  notes: string | undefined,
  locale: SupportedLocale
): string {
  const raw =
    notes ??
    "Verified by Critic Agent against Playbook policy and hallucination guard.";
  if (locale === "en") {
    return raw;
  }
  if (
    raw ===
    "Verified by Critic Agent against Playbook policy and hallucination guard."
  ) {
    return locale === "es"
      ? "Verificado por Critic Agent frente a la política del Playbook y el guardia anti-alucinaciones."
      : "Vérifié par l'Agent Critic au regard du Playbook et du garde-fou anti-hallucinations.";
  }
  if (locale === "es") {
    return raw
      .replace(
        /^Critic Guard:\s*Playbook policy aligned\b/i,
        "Critic Guard: Política del Playbook alineada"
      )
      .replace(
        /no hallucinations detected/gi,
        "sin alucinaciones detectadas"
      );
  }
  return raw
    .replace(
      /^Critic Guard:\s*Playbook policy aligned\b/i,
      "Critic Guard : Politique du Playbook alignée"
    )
    .replace(
      /no hallucinations detected/gi,
      "aucune hallucination détectée"
    );
}

export function localizeRedlineSuggestionForDisplay(
  suggestion: RedlineSuggestionDTO,
  locale: SupportedLocale
): RedlineSuggestionDTO {
  if (locale === "en") {
    return suggestion;
  }

  const alreadyTargetLocalized =
    locale === "es"
      ? suggestion.rationale.includes("[Postura ") ||
        suggestion.rationale.includes("Argumento:")
      : suggestion.rationale.includes("[Posture ") ||
        suggestion.rationale.includes("Argumentaire :");

  if (alreadyTargetLocalized) {
    return suggestion;
  }

  const demoEntry = DEMO_REDLINE_TRANSLATIONS[suggestion.id]?.[locale];
  const wasCustomModified =
    suggestion.status === "MODIFIED" ||
    suggestion.rationale.includes("Copilot") ||
    suggestion.rationale.includes("[Auto-Refined");

  if (demoEntry && !wasCustomModified) {
    return {
      ...suggestion,
      proposed_text: demoEntry.proposedText,
      rationale: demoEntry.rationale,
      critic_notes: demoEntry.criticNotes,
    };
  }

  return {
    ...suggestion,
    rationale: translateGenericRedlineStrings(suggestion.rationale, locale),
    critic_notes: localizeCriticNotesText(suggestion.critic_notes, locale),
  };
}

export function localizeCrossClauseIssueType(
  issueType: CrossClauseIssueType,
  locale: SupportedLocale
): string {
  if (locale === "en") {
    if (issueType === "CONTRADICTION") return "Contradiction";
    if (issueType === "BROKEN_REFERENCE") return "Broken Reference";
    return "Undefined Term";
  }
  if (locale === "es") {
    if (issueType === "CONTRADICTION") return "Contradicción";
    if (issueType === "BROKEN_REFERENCE") return "Referencia Rota";
    return "Término Sin Definir";
  }
  if (issueType === "CONTRADICTION") return "Contradiction";
  if (issueType === "BROKEN_REFERENCE") return "Renvoi Cassé";
  return "Terme Non Défini";
}

export function localizeCrossClauseFindingForDisplay(
  finding: CrossClauseFindingDTO,
  locale: SupportedLocale
): CrossClauseFindingDTO {
  if (locale === "en") {
    return finding;
  }

  const id = finding.id;
  if (id.includes("liability")) {
    return locale === "es"
      ? {
          ...finding,
          title:
            "Contradicción Cruzada entre Limitación de Responsabilidad e Indemnización",
          description:
            "La cláusula de Limitación de Responsabilidad impone un límite estricto ($500) mientras que la cláusula de Indemnización exige obligaciones amplias o ilimitadas sin una excepción explícita en la cláusula de límite.",
          recommended_fix:
            "Alinee ambas cláusulas especificando qué obligaciones de indemnización están exentas del límite general o sujetas a un súper-límite mutuo (p. ej., 2× tarifas anuales).",
        }
      : {
          ...finding,
          title:
            "Contradiction Croisée entre Limitation de Responsabilité et Indemnisation",
          description:
            "La clause de Limitation de Responsabilité impose un plafond strict (500 $) tandis que la clause d'Indemnisation prévoit des obligations larges ou non plafonnées sans exception explicite dans le plafond.",
          recommended_fix:
            "Harmonisez les deux clauses en précisant quelles obligations d'indemnisation sont exclues du plafond général ou soumises à un super-plafond mutuel (ex. 2× les redevances annuelles).",
        };
  }

  if (id.includes("payment")) {
    const netMatches = finding.title.match(/Net\s+(\d+)\s+vs\.\s+Net\s+(\d+)/i);
    const d1 = netMatches?.[1] ?? "7";
    const d2 = netMatches?.[2] ?? "30";
    return locale === "es"
      ? {
          ...finding,
          title: `Plazos de Pago Contradictorios (Neto ${d1} frente a Neto ${d2} Días)`,
          description: `Las cláusulas especifican ventanas de facturación incompatibles (Neto ${d1} días en una sección frente a Neto ${d2} días en otra), lo que genera disputas operativas en cuentas por pagar.`,
          recommended_fix: `Estandarice todos los plazos de pago del acuerdo a Neto ${Math.max(Number(d1), Number(d2))} días con aviso de suspensión unificado.`,
        }
      : {
          ...finding,
          title: `Délais de Paiement Contradictoires (Net ${d1} contre Net ${d2} Jours)`,
          description: `Les clauses prévoient des délais de facturation incohérents (Net ${d1} jours contre Net ${d2} jours), créant des litiges opérationnels de facturation.`,
          recommended_fix: `Uniformisez tous les délais de règlement sur Net ${Math.max(Number(d1), Number(d2))} jours avec une clause de préavis unique.`,
        };
  }

  if (id.includes("cure")) {
    return locale === "es"
      ? {
          ...finding,
          title: "Contradicción en Derechos de Rescisión y Subsanación",
          description:
            "Una disposición permite la suspensión o terminación inmediata sin preaviso, entrando en conflicto directo con la cláusula que garantiza un período de notificación escrita y subsanación de 30 días.",
          recommended_fix:
            "Subordine cualquier derecho de suspensión al vencimiento previo del plazo de notificación escrita y subsanación de 30 días.",
        }
      : {
          ...finding,
          title: "Contradiction sur les Droits de Résiliation et de Remédiation",
          description:
            "Une disposition autorise la suspension ou résiliation immédiate sans préavis, contredisant directement le délai de préavis écrit et de remédiation de 30 jours.",
          recommended_fix:
            "Conditionnez tout droit de suspension à l'expiration préalable du préavis écrit et du délai de remédiation de 30 jours.",
        };
  }

  if (id.includes("ai-train")) {
    return locale === "es"
      ? {
          ...finding,
          title: "Contradicción entre Datos del Cliente y Entrenamiento de Modelos de IA",
          description:
            "La cláusula de datos otorga licencia para entrenar modelos fundacionales de IA públicos/terceros, lo que entra en conflicto con las garantías de confidencialidad y cumplimiento RGPD/CCPA.",
          recommended_fix:
            "Prohíba expresamente el entrenamiento de modelos fundacionales con Datos del Cliente y limite la telemetría únicamente a métricas de seguridad agregadas y anonimizadas.",
        }
      : {
          ...finding,
          title: "Contradiction entre Données Client et Entraînement de Modèles d'IA",
          description:
            "La clause de données autorise l'entraînement de modèles d'IA publics ou tiers sur les données client, en contradiction avec les garanties de confidentialité et RGPD/CCPA.",
          recommended_fix:
            "Interdisez expressément l'entraînement de modèles sur les Données Client et limitez la télémétrie aux métriques de sécurité agrégées et anonymisées.",
        };
  }

  const brokenRefMatch = finding.title.match(/Section\s+([0-9.]+)/i);
  if (finding.issue_type === "BROKEN_REFERENCE" && brokenRefMatch) {
    const sec = brokenRefMatch[1];
    return locale === "es"
      ? {
          ...finding,
          title: `Referencia Rota a la Sección ${sec}`,
          description: `Esta cláusula remite a la Sección ${sec}, pero no existe ninguna cláusula numerada como ${sec} en el contrato analizado.`,
          recommended_fix: `Actualice o elimine la referencia cruzada rota a la Sección ${sec} para evitar ambigüedad interpretativa.`,
        }
      : {
          ...finding,
          title: `Renvoi Cassé vers la Section ${sec}`,
          description: `Cette clause renvoie à la Section ${sec}, mais aucune clause numérotée ${sec} n'existe dans le contrat analysé.`,
          recommended_fix: `Mettez à jour ou supprimez le renvoi erroné vers la Section ${sec} afin d'éviter toute ambiguïté contractuelle.`,
        };
  }

  const undefinedTermMatch = finding.title.match(/:\s*'([^']+)'/);
  if (finding.issue_type === "UNDEFINED_TERM" && undefinedTermMatch) {
    const term = undefinedTermMatch[1];
    return locale === "es"
      ? {
          ...finding,
          title: `Término en Mayúsculas Sin Definir: '${term}'`,
          description: `El término en mayúsculas "${term}" se utiliza en una obligación operativa sin una definición contractual vinculante en el documento.`,
          recommended_fix: `Agregue una definición formal de "${term}" en la Sección de Definiciones o reemplácelo por minúsculas descriptivas.`,
        }
      : {
          ...finding,
          title: `Terme en Majuscule Non Défini : '${term}'`,
          description: `Le terme avec majuscule « ${term} » est employé dans une clause opérationnelle sans définition contractuelle dans le document.`,
          recommended_fix: `Ajoutez une définition formelle de « ${term} » dans la section Définitions ou utilisez une formulation descriptive en minuscules.`,
        };
  }

  return finding;
}

const SEEDED_PLAYBOOK_TRANSLATIONS: Record<
  string,
  Record<
    "es" | "fr",
    {
      category: string;
      standard_position: string;
      fallback_position: string;
      unacceptable_triggers: string;
    }
  >
> = {
  "p0000000-0000-4000-8000-000000000301": {
    es: {
      category: "Limitación de Responsabilidad",
      standard_position:
        "Responsabilidad acumulada mutua limitada a 12 meses de tarifas pagadas o pagaderas, con exclusión recíproca de daños indirectos y consecuentes.",
      fallback_position:
        "Súper-límite mutuo equivalente a 2× tarifas anuales para brechas de seguridad de datos, confidencialidad o indemnización por PI.",
      unacceptable_triggers:
        "límite de $500, responsabilidad ilimitada del Cliente, exención total de responsabilidad del Proveedor",
    },
    fr: {
      category: "Limitation de Responsabilité",
      standard_position:
        "Responsabilité cumulée mutuelle plafonnée à 12 mois de redevances payées ou dues, avec exclusion réciproque des dommages indirects et consécutifs.",
      fallback_position:
        "Super-plafond mutuel égal à 2× les redevances annuelles pour atteinte à la confidentialité des données ou contrefaçon de PI.",
      unacceptable_triggers:
        "plafond à 500 $, responsabilité illimitée du Client, exclusion totale de responsabilité du Fournisseur",
    },
  },
  "p0000000-0000-4000-8000-000000000302": {
    es: {
      category: "Indemnización",
      standard_position:
        "Indemnización mutua por infracción de propiedad intelectual de terceros, dolo o negligencia grave, con control razonable de la defensa.",
      fallback_position:
        "Indemnización mutua proporcionada a la culpa con notificación oportuna y mitigación estándar en materia de PI.",
      unacceptable_triggers:
        "indemnizar al Proveedor por su propia negligencia grave, indemnización unilateral del Cliente",
    },
    fr: {
      category: "Indemnisation",
      standard_position:
        "Indemnisation mutuelle pour contrefaçon de propriété intellectuelle de tiers, faute intentionnelle ou négligence grave, avec contrôle de la défense.",
      fallback_position:
        "Indemnisation mutuelle proportionnelle à la faute avec notification écrite préalable et mesures standard de remédiation PI.",
      unacceptable_triggers:
        "indemniser le Fournisseur pour sa propre négligence grave, indemnisation unilatérale du Client",
    },
  },
  "p0000000-0000-4000-8000-000000000303": {
    es: {
      category: "Acuerdo de Nivel de Servicio (SLA)",
      standard_position:
        "Disponibilidad mensual garantizada del 99,9% en producción, créditos de servicio escalonados de hasta el 25% y rescisión por incumplimientos crónicos.",
      fallback_position:
        "Disponibilidad del 99,9% excluyendo mantenimiento programado con preaviso de 48 h y créditos escalonados de hasta el 15%.",
      unacceptable_triggers:
        "95% de disponibilidad, créditos a entera discreción, esfuerzos comercialmente razonables sin garantía",
    },
    fr: {
      category: "Accord de Niveau de Service (SLA)",
      standard_position:
        "Disponibilité mensuelle garantie de 99,9 % en production, crédits de service progressifs jusqu'à 25 % et résiliation pour manquements chroniques.",
      fallback_position:
        "Disponibilité de 99,9 % hors maintenance planifiée (préavis 48 h) avec crédits progressifs jusqu'à 15 %.",
      unacceptable_triggers:
        "disponibilité de 95 %, crédits à seule discrétion, obligation de moyens sans garantie SLA",
    },
  },
  "p0000000-0000-4000-8000-000000000304": {
    es: {
      category: "Privacidad de Datos y Entrenamiento de IA",
      standard_position:
        "Prohibición estricta de entrenar modelos fundacionales de IA públicos o de terceros con Datos del Cliente; cumplimiento RGPD/CCPA y aviso de brecha en 24 horas.",
      fallback_position:
        "Uso exclusivo de telemetría estrictamente agregada e irreversiblemente anonimizada para monitoreo de seguridad y estabilidad.",
      unacceptable_triggers:
        "licencia perpetua para entrenar IA, entrenamiento en modelos compartidos con Datos del Cliente",
    },
    fr: {
      category: "Confidentialité des Données et Entraînement d'IA",
      standard_position:
        "Interdiction stricte d'entraîner des modèles d'IA publics ou tiers sur les Données Client ; conformité RGPD/CCPA et notification sous 24 heures.",
      fallback_position:
        "Usage autorisé uniquement de télémétrie strictement agrégée et irréversiblement anonymisée à des fins de sécurité.",
      unacceptable_triggers:
        "licence perpétuelle d'entraînement IA, entraînement de modèles publics sur Données Client",
    },
  },
  "p0000000-0000-4000-8000-000000000305": {
    es: {
      category: "Legislación Aplicable y Resolución de Disputas",
      standard_position:
        "Leyes del Estado de Delaware o jurisdicción mutua neutral y derecho de retención de buena fe en facturas disputadas con subsanación de 30 días.",
      fallback_position:
        "Leyes de Nueva York o California con escalamiento ejecutivo previo y preaviso mínimo de 15 días antes de suspensión.",
      unacceptable_triggers:
        "suspensión inmediata sin preaviso, pago Neto 7 días sin derecho a disputa",
    },
    fr: {
      category: "Droit Applicable et Règlement des Litiges",
      standard_position:
        "Lois de l'État du Delaware ou juridiction neutre mutuelle, rétention de bonne foi des factures contestées et remédiation de 30 jours.",
      fallback_position:
        "Lois de New York ou Californie avec escalade dirigeante préalable et préavis minimum de 15 jours avant suspension.",
      unacceptable_triggers:
        "suspension immédiate sans préavis, paiement Net 7 jours sans contestation",
    },
  },
};

const EXTRACTED_PROFILE_TRANSLATIONS: Record<
  string,
  Record<
    "es" | "fr",
    {
      category: string;
      standard_position: string;
      fallback_position: string;
      unacceptable_triggers: string[];
    }
  >
> = {
  "Data Privacy & AI": {
    es: {
      category: "Privacidad de Datos e IA",
      standard_position:
        "El Proveedor nunca usará Datos del Cliente para entrenar modelos públicos o fundacionales de IA, cumplirá salvaguardas RGPD/CCPA y notificará incidentes confirmados en 24 horas.",
      fallback_position:
        "Permite únicamente telemetría estrictamente anonimizada con consentimiento previo explícito y aviso de brecha confirmada en 72 horas.",
      unacceptable_triggers: [
        "entrenar modelos fundacionales públicos",
        "licencia irrevocable sobre datos del cliente",
        "sin plazo de notificación de brechas",
      ],
    },
    fr: {
      category: "Confidentialité des Données et IA",
      standard_position:
        "Le Fournisseur n'utilisera jamais les Données Client pour entraîner des modèles d'IA publics, respectera les garanties RGPD/CCPA et notifiera tout incident confirmé sous 24 heures.",
      fallback_position:
        "Autorise uniquement la télémétrie strictement anonymisée sur accord écrit préalable et notification de violation confirmée sous 72 heures.",
      unacceptable_triggers: [
        "entraîner des modèles de fondation publics",
        "licence irrévocable sur données client",
        "aucun délai de notification de violation",
      ],
    },
  },
  Liability: {
    es: {
      category: "Limitación de Responsabilidad",
      standard_position:
        "Límite acumulado mutuo de responsabilidad equivalente a 12 meses de tarifas (o piso aprobado), excluyendo daños indirectos y consecuentes salvo indemnización de PI y confidencialidad.",
      fallback_position:
        "Súper-límite mutuo de hasta 24 meses de tarifas para brechas de seguridad manteniendo la limitación sobre daños directos.",
      unacceptable_triggers: [
        "responsabilidad ilimitada",
        "daños consecuentes sin límite",
        "responsable único sin tope",
      ],
    },
    fr: {
      category: "Responsabilité",
      standard_position:
        "Plafond mutuel cumulé égal à 12 mois de redevances (ou plancher approuvé), excluant les dommages indirects sauf contrefaçon de PI et confidentialité.",
      fallback_position:
        "Super-plafond mutuel jusqu'à 24 mois de redevances pour atteinte à la sécurité tout en limitant les dommages directs.",
      unacceptable_triggers: [
        "responsabilité illimitée",
        "dommages consécutifs non plafonnés",
        "seul responsable sans plafond",
      ],
    },
  },
  "SLA & Uptime": {
    es: {
      category: "SLA y Disponibilidad",
      standard_position:
        "Disponibilidad mensual mínima en producción del 99,9% respaldada por créditos de SLA escalonados y derecho de rescisión ante fallos crónicos.",
      fallback_position:
        "Objetivo de disponibilidad mensual del 99,5% con créditos de servicio limitados al 15% de la suscripción mensual.",
      unacceptable_triggers: [
        "solo mejores esfuerzos de disponibilidad",
        "sin créditos de servicio",
        "disponibilidad tal cual sin garantía",
      ],
    },
    fr: {
      category: "SLA et Disponibilité",
      standard_position:
        "Disponibilité mensuelle minimale de 99,9 % en production garantie par des crédits SLA progressifs et un droit de résiliation pour défaillances chroniques.",
      fallback_position:
        "Objectif mensuel de 99,5 % avec crédits de service plafonnés à 15 % des redevances mensuelles.",
      unacceptable_triggers: [
        "disponibilité au mieux uniquement",
        "aucun crédit de service",
        "fourniture en l'état sans garantie",
      ],
    },
  },
  "Payment Terms": {
    es: {
      category: "Condiciones de Pago",
      standard_position:
        "Facturas no impugnadas pagaderas entre 30 y 45 días netos desde recepción, con retención de buena fe sin intereses moratorios ni suspensión.",
      fallback_position:
        "Neto 30 días en montos no disputados, interés moratorio máximo del 1,0% mensual y 60 días de preaviso para ajustes de renovación.",
      unacceptable_triggers: [
        "vencimiento inmediato al recibir",
        "sin derecho a impugnar facturas",
        "aumento unilateral ilimitado de precios",
      ],
    },
    fr: {
      category: "Conditions de Paiement",
      standard_position:
        "Factures non contestées payables à 30 à 45 jours nets après réception, avec rétention de bonne foi sans pénalité ni suspension.",
      fallback_position:
        "Net 30 jours sur montants incontestés, intérêts plafonnés à 1,0 % par mois et préavis de 60 jours avant hausse tarifaire.",
      unacceptable_triggers: [
        "exigible immédiatement à réception",
        "aucun droit de contester les factures",
        "hausse de prix unilatérale illimitée",
      ],
    },
  },
  Termination: {
    es: {
      category: "Vigencia y Rescisión",
      standard_position:
        "La rescisión por incumplimiento sustancial requiere 30 días de preaviso escrito y período de subsanación, con reembolso a prorrata de tarifas prepagadas no utilizadas.",
      fallback_position:
        "15 días hábiles de subsanación para impago no impugnado y 60 días de aviso mutuo de no renovación.",
      unacceptable_triggers: [
        "rescindir inmediatamente sin preaviso",
        "pérdida de tarifas prepagadas",
        "renovación automática obligatoria de 3 años",
      ],
    },
    fr: {
      category: "Résiliation",
      standard_position:
        "La résiliation pour manquement substantiel requiert 30 jours de préavis écrit et un délai de remédiation, avec remboursement au prorata des sommes prépayées non utilisées.",
      fallback_position:
        "15 jours ouvrés de remédiation pour non-paiement incontesté et préavis mutuel de non-renouvellement de 60 jours.",
      unacceptable_triggers: [
        "résiliation immédiate sans préavis",
        "confiscation des montants prépayés",
        "reconduction automatique bloquée sur 3 ans",
      ],
    },
  },
  "IP Ownership": {
    es: {
      category: "Titularidad de PI",
      standard_position:
        "El Cliente conserva la titularidad exclusiva de su PI Preexistente, Datos del Cliente y entregables a medida abonados.",
      fallback_position:
        "El Proveedor conserva herramientas genéricas de plataforma con licencia empresarial perpetua y libre de regalías al Cliente.",
      unacceptable_triggers: [
        "ceder toda la pi del cliente al proveedor",
        "el proveedor posee todos los entregables a medida",
      ],
    },
    fr: {
      category: "Propriété Intellectuelle",
      standard_position:
        "Le Client conserve la propriété exclusive de sa PI préexistante, de ses Données Client et des livrables sur mesure financés.",
      fallback_position:
        "Le Fournisseur conserve ses outils génériques avec licence d'entreprise perpétuelle et gratuite accordée au Client.",
      unacceptable_triggers: [
        "céder toute la pi client au fournisseur",
        "le fournisseur détient tous les livrables sur mesure",
      ],
    },
  },
  "Commercial Terms": {
    es: {
      category: "Términos Comerciales",
      standard_position:
        "Mantener la línea base corporativa aprobada del acuerdo comercial.",
      fallback_position:
        "Permitir ajustes comerciales mutuos limitados sin alterar la asignación principal de riesgos.",
      unacceptable_triggers: [
        "modificación unilateral de la contraparte",
        "renuncia total a obligación protectora",
      ],
    },
    fr: {
      category: "Conditions Commerciales",
      standard_position:
        "Maintenir le socle contractuel approuvé par la politique d'entreprise.",
      fallback_position:
        "Autoriser des ajustements commerciaux mutuels limités sans modifier la répartition principale des risques.",
      unacceptable_triggers: [
        "modification unilatérale par la contrepartie",
        "renonciation totale à une obligation protectrice",
      ],
    },
  },
};

export function localizeExtractedCandidateForDisplay(
  candidate: ExtractedPlaybookRuleCandidateDTO,
  locale: SupportedLocale
): ExtractedPlaybookRuleCandidateDTO {
  if (locale === "en") {
    return candidate;
  }
  const match = EXTRACTED_PROFILE_TRANSLATIONS[candidate.category]?.[locale];
  if (match) {
    return {
      ...candidate,
      category: match.category,
      standard_position: match.standard_position,
      fallback_position: match.fallback_position,
      unacceptable_triggers: match.unacceptable_triggers,
    };
  }
  return {
    ...candidate,
    category: localizeHeadingText(candidate.category, locale),
  };
}

export function localizePlaybookRuleForDisplay(
  rule: PlaybookRuleDTO,
  locale: SupportedLocale
): PlaybookRuleDTO {
  if (locale === "en") {
    return rule;
  }
  const byId = SEEDED_PLAYBOOK_TRANSLATIONS[rule.id]?.[locale];
  if (byId) {
    return {
      ...rule,
      category: byId.category,
      standard_position: byId.standard_position,
      fallback_position: byId.fallback_position,
      unacceptable_triggers: byId.unacceptable_triggers,
    };
  }
  const byExtracted = EXTRACTED_PROFILE_TRANSLATIONS[rule.category]?.[locale];
  if (byExtracted && rule.id.startsWith("p-ext-")) {
    return {
      ...rule,
      category: byExtracted.category,
      standard_position: byExtracted.standard_position,
      fallback_position: byExtracted.fallback_position,
      unacceptable_triggers: byExtracted.unacceptable_triggers.join(", "),
    };
  }
  return {
    ...rule,
    category: localizeHeadingText(rule.category, locale),
  };
}

export function localizeAuditAction(
  action: AuditAction,
  locale: SupportedLocale
): string {
  if (locale === "en") {
    return action;
  }
  const map: Record<"es" | "fr", Record<AuditAction, string>> = {
    es: {
      DOCUMENT_INGESTED: "DOCUMENTO_INGESTIONADO",
      DOCUMENT_ANALYZED: "DOCUMENTO_ANALIZADO",
      SUGGESTION_ACCEPTED: "SUGERENCIA_ACEPTADA",
      SUGGESTION_MODIFIED: "SUGERENCIA_MODIFICADA",
      SUGGESTION_REJECTED: "SUGERENCIA_RECHAZADA",
      SUGGESTION_REFINED: "SUGERENCIA_REFINADA",
      SUGGESTION_VERIFIED: "SUGERENCIA_VERIFICADA",
      PUSHBACK_SIMULATED: "OBJECIÓN_SIMULADA",
      PLAYBOOK_AUTO_EXTRACTED: "PLAYBOOK_EXTRAÍDO_IA",
      AI_CACHE_CLEARED: "CACHÉ_IA_PURGADA",
      COMMENT_CREATED: "COMENTARIO_CREADO",
      DOCUMENT_EXPORTED: "DOCUMENTO_EXPORTADO",
      CROSS_CLAUSE_CHECKED: "RADAR_CRUZADO_VERIFICADO",
    },
    fr: {
      DOCUMENT_INGESTED: "DOCUMENT_INTÉGRÉ",
      DOCUMENT_ANALYZED: "DOCUMENT_ANALYSÉ",
      SUGGESTION_ACCEPTED: "SUGGESTION_ACCEPTÉE",
      SUGGESTION_MODIFIED: "SUGGESTION_MODIFIÉE",
      SUGGESTION_REJECTED: "SUGGESTION_REJETÉE",
      SUGGESTION_REFINED: "SUGGESTION_AFFINÉE",
      SUGGESTION_VERIFIED: "SUGGESTION_VÉRIFIÉE",
      PUSHBACK_SIMULATED: "OBJECTION_SIMULÉE",
      PLAYBOOK_AUTO_EXTRACTED: "PLAYBOOK_EXTRAIT_IA",
      AI_CACHE_CLEARED: "CACHE_IA_PURGÉ",
      COMMENT_CREATED: "COMMENTAIRE_CRÉÉ",
      DOCUMENT_EXPORTED: "DOCUMENT_EXPORTÉ",
      CROSS_CLAUSE_CHECKED: "RADAR_CROISÉ_VÉRIFIÉ",
    },
  };
  return map[locale][action] ?? action;
}

export function localizeOperationName(
  operation: string,
  locale: SupportedLocale
): string {
  if (locale === "en") {
    return operation;
  }
  const map: Record<"es" | "fr", Record<string, string>> = {
    es: {
      DOCUMENT_AUDIT: "AUDITORÍA_DOCUMENTO",
      CLAUSE_COPILOT: "COPILOTO_CLÁUSULA",
      CRITIC_VERIFY: "VERIFICACIÓN_CRITIC",
      PUSHBACK_SIMULATOR: "SIMULADOR_OBJECIONES",
      PLAYBOOK_EXTRACTOR: "EXTRACTOR_PLAYBOOK",
      CROSS_CLAUSE_RADAR: "RADAR_CRUZADO",
    },
    fr: {
      DOCUMENT_AUDIT: "AUDIT_DOCUMENT",
      CLAUSE_COPILOT: "COPILOTE_CLAUSE",
      CRITIC_VERIFY: "VÉRIFICATION_CRITIC",
      PUSHBACK_SIMULATOR: "SIMULATEUR_OBJECTIONS",
      PLAYBOOK_EXTRACTOR: "EXTRACTEUR_PLAYBOOK",
      CROSS_CLAUSE_RADAR: "RADAR_CROISÉ",
    },
  };
  return map[locale][operation] ?? operation;
}

export function localizePushbackSimulationForDisplay(
  sim: SimulatePushbackResponseDTO,
  locale: SupportedLocale
): SimulatePushbackResponseDTO {
  if (locale === "en") {
    return sim;
  }
  const objLower = sim.expected_objection.toLowerCase();
  const personaLower = sim.counterparty_persona.toLowerCase();

  if (objLower.includes("$500") || objLower.includes("liability cap")) {
    return locale === "es"
      ? {
          ...sim,
          counterparty_persona: "Abogado Comercial y Legal del Proveedor Empresarial",
          expected_objection:
            "El abogado de la contraparte argumentará que elevar el límite de responsabilidad de $500 a 12 meses de tarifas crea una exposición financiera desproporcionada frente a los ingresos recurrentes anuales.",
          rebuttal_talking_point:
            "Un límite asimétrico de $500 traslada el riesgo catastrófico de caída del proveedor SaaS directamente al Cliente y no supera auditoría corporativa. Un tope mutuo de 12 meses de tarifas con exclusión recíproca de daños consecuentes es paridad estándar de mercado.",
          fallback_compromise_text:
            "La responsabilidad acumulada total de cada parte bajo este Contrato no excederá dos veces (2×) las tarifas anuales pagadas por brecha de datos o indemnización de PI, y doce (12) meses de tarifas para daños directos generales.",
        }
      : {
          ...sim,
          counterparty_persona: "Directeur Juridique et Commercial du Fournisseur",
          expected_objection:
            "Le conseil adverse soutiendra que porter le plafond de responsabilité de 500 $ à 12 mois de redevances crée une exposition financière disproportionnée par rapport au revenu récurrent annuel.",
          rebuttal_talking_point:
            "Un plafond asymétrique de 500 $ transfère un risque catastrophique d'interruption SaaS directement au Client. Un plafond mutuel de 12 mois avec exclusion réciproque des dommages indirects correspond aux standards du marché.",
          fallback_compromise_text:
            "La responsabilité cumulée totale de chaque partie au titre du présent Contrat n'excédera pas deux fois (2×) les redevances annuelles payées pour atteinte aux données ou contrefaçon de PI, et douze (12) mois de redevances pour les dommages directs généraux.",
        };
  }

  if (personaLower.includes("intellectual property") || objLower.includes("indemnity")) {
    return locale === "es"
      ? {
          ...sim,
          counterparty_persona: "Abogado de Riesgos y Propiedad Intelectual del Proveedor",
          expected_objection:
            "La contraparte se resistirá a una exposición amplia de indemnización por PI/culpa e insistirá en un límite proporcional a la culpa y el control exclusivo de la defensa.",
          rebuttal_talking_point:
            "El Cliente no puede indemnizar al Proveedor por la propia negligencia grave del Proveedor ni por reclamaciones de terceros sobre software propietario del Proveedor. La indemnización mutua protege equitativamente a ambas partes.",
          fallback_compromise_text:
            "Cada parte defenderá e indemnizará a la otra frente a reclamaciones de terceros por infracción de PI y negligencia grave, sujeto a un súper-límite mutuo igual a dos veces (2×) las tarifas anuales y notificación oportuna por escrito.",
        }
      : {
          ...sim,
          counterparty_persona: "Conseil Risques & Propriété Intellectuelle du Fournisseur",
          expected_objection:
            "La partie adverse résistera à une indemnisation large en PI et insistera sur un plafond proportionnel à la faute et le contrôle exclusif de la défense.",
          rebuttal_talking_point:
            "Le Client ne saurait indemniser le Fournisseur pour sa propre négligence grave ou des réclamations liées à son logiciel propriétaire. Une indemnisation réciproque protège équitablement chaque partie.",
          fallback_compromise_text:
            "Chaque partie défendra et indemnisera l'autre contre les réclamations de tiers pour contrefaçon de PI et négligence grave, sous réserve d'un super-plafond mutuel égal à deux fois (2×) les redevances annuelles et d'une notification écrite rapide.",
        };
  }

  if (objLower.includes("sla") || objLower.includes("uptime") || objLower.includes("revenue deferral")) {
    return locale === "es"
      ? {
          ...sim,
          counterparty_persona: "Abogado de Operaciones Cloud e Ingresos del Proveedor",
          expected_objection:
            "La contraparte alegará que penalizaciones estrictas de SLA y rescisión por fallos crónicos generan riesgos de reconocimiento de ingresos durante mantenimientos de subprocesadores.",
          rebuttal_talking_point:
            "Los despliegues en producción empresarial exigen disponibilidad vinculante. Créditos escalonados limitados a la cuota mensual y rescisión solo ante fallos crónicos acotan el riesgo financiero del Proveedor.",
          fallback_compromise_text:
            "El Proveedor garantiza 99,9% de disponibilidad mensual con créditos escalonados de hasta el 15% mensual, y el Cliente podrá rescindir tras cuatro (4) meses consecutivos por debajo del 99,5%.",
        }
      : {
          ...sim,
          counterparty_persona: "Conseil Opérations Cloud et Revenus du Fournisseur",
          expected_objection:
            "La partie adverse fera valoir que les pénalités SLA strictes et les clauses de sortie créent des contraintes comptables lors des maintenances cloud.",
          rebuttal_talking_point:
            "Les environnements de production exigent des engagements de disponibilité contraignants. Des crédits plafonnés à la redevance mensuelle et une sortie uniquement pour manquement chronique limitent le risque du Fournisseur.",
          fallback_compromise_text:
            "Le Fournisseur garantit une disponibilité mensuelle de 99,9 % avec crédits progressifs jusqu'à 15 % de la redevance mensuelle, et le Client peut résilier après quatre (4) mois consécutifs sous 99,5 %.",
        };
  }

  if (personaLower.includes("privacy") || objLower.includes("telemetry") || objLower.includes("ai")) {
    return locale === "es"
      ? {
          ...sim,
          counterparty_persona: "Delegado de Protección de Datos (DPO) y Producto de IA del Proveedor",
          expected_objection:
            "La contraparte podrá argumentar que requiere ingesta automatizada de telemetría para detección de anomalías, filtrado de abuso y confiabilidad operativa.",
          rebuttal_talking_point:
            "Las métricas operativas agregadas e irreversiblemente anonimizadas para seguridad siguen permitidas, mientras que entrenar modelos fundacionales compartidos con Datos Confidenciales del Cliente está estrictamente prohibido.",
          fallback_compromise_text:
            "El Proveedor no utilizará Datos Confidenciales del Cliente para entrenar modelos de IA públicos o de terceros, pudiendo analizar telemetría estrictamente agregada y anonimizada únicamente para seguridad y estabilidad de la plataforma.",
        }
      : {
          ...sim,
          counterparty_persona: "Délégué à la Protection des Données (DPO) & Produit IA du Fournisseur",
          expected_objection:
            "La partie adverse peut soutenir qu'elle a besoin d'une télémétrie automatisée pour la détection d'anomalies, le filtrage des abus et la fiabilité de la plateforme.",
          rebuttal_talking_point:
            "Les métriques agrégées et irréversiblement anonymisées restent autorisées pour la sécurité, tandis que l'entraînement de modèles d'IA partagés sur les Données Client demeure strictement interdit.",
          fallback_compromise_text:
            "Le Fournisseur n'utilisera pas les Données Confidentielles du Client pour entraîner des modèles d'IA publics ou tiers, mais pourra analyser une télémétrie strictement agrégée et anonymisée pour la sécurité du service.",
        };
  }

  return locale === "es"
    ? {
        ...sim,
        counterparty_persona: "Abogado Comercial Sénior de la Contraparte",
        expected_objection:
          "El abogado opositor argumentará que el redline propuesto modifica su asignación comercial estándar.",
        rebuttal_talking_point:
          "Nuestro redline sustituye una exposición unilateral por términos mutuos estándar en el mercado empresarial.",
        fallback_compromise_text:
          "Cada parte cumplirá sus obligaciones de manera comercialmente razonable y recíproca, sujeta a un período de subsanación de 30 días.",
      }
    : {
        ...sim,
        counterparty_persona: "Conseil Commercial Senior de la Partie Adverse",
        expected_objection:
          "Le conseil adverse soutiendra que la révision proposée modifie l'équilibre commercial standard du contrat.",
        rebuttal_talking_point:
          "Notre proposition remplace une exposition unilatérale par des clauses mutuelles conformes aux standards du marché.",
        fallback_compromise_text:
          "Chaque partie exécutera ses obligations de manière commercialement raisonnable et réciproque sous réserve d'un délai de remédiation de 30 jours.",
      };
}

export interface RedlineDrawerUiCopy {
  copilotTitle: string;
  copilotSubtitle: string;
  chipMutualLabel: string;
  chipMutualPrompt: string;
  chipCapLabel: string;
  chipCapPrompt: string;
  chipCureLabel: string;
  chipCurePrompt: string;
  chipSoftenLabel: string;
  chipSoftenPrompt: string;
  copilotPlaceholder: string;
  copilotClose: string;
  copilotRefining: string;
  copilotRefineBtn: string;
  copilotSuccessFallback: string;
  copilotErrorFallback: string;
  pushbackTitle: string;
  simulatedPersonaPrefix: string;
  acceptanceLikelihoodPrefix: string;
  simulatingSpinner: string;
  expectedObjectionLabel: string;
  round2RebuttalLabel: string;
  copiedBtn: string;
  copyRebuttalBtn: string;
  fallbackCompromiseLabel: string;
  useCompromiseBtn: string;
  reSimulateBtn: string;
  compromiseAppliedToast: string;
  pushbackErrorFallback: string;
  verifyErrorFallback: string;
  emptyScanTitle: string;
  emptyScanDesc: string;
  telemetryTokensSavedUnit: string;
  telemetryTokUnit: string;
  telemetryViewerTitle: string;
  telemetryPurgeError: string;
  extractorMinCharsError: string;
  extractorNoFileError: string;
  extractorViewerTitle: string;
  gutterMapLabel: string;
  compliantFallbackHeading: string;
}

export const STUDIO_DRAWER_UI_COPY: Record<
  SupportedLocale,
  RedlineDrawerUiCopy
> = {
  en: {
    copilotTitle: "Inline AI Clause Copilot",
    copilotSubtitle: "Steer wording with custom prompt",
    chipMutualLabel: "Make Strictly Mutual",
    chipMutualPrompt:
      "Make this obligation strictly mutual and exclude indirect damages.",
    chipCapLabel: "Cap Liability at $100,000",
    chipCapPrompt:
      "Cap aggregate liability at $100,000 instead of 12 months of fees.",
    chipCureLabel: "Add 30-Day Cure Period",
    chipCurePrompt:
      "Add a 30-day written notice and cure period before any termination.",
    chipSoftenLabel: "Soften Tone for Partner",
    chipSoftenPrompt:
      "Soften the legal tone for a strategic partner while keeping core IP protection.",
    copilotPlaceholder:
      "e.g., Cap liability at $100,000 and add a 30-day notice and cure period...",
    copilotClose: "Close",
    copilotRefining: "Refining...",
    copilotRefineBtn: "Refine with AI",
    copilotSuccessFallback: "Clause refined successfully!",
    copilotErrorFallback: "Failed to refine clause.",
    pushbackTitle: "Counterparty Pushback Simulator & Round-2 Strategy",
    simulatedPersonaPrefix: "Simulated Persona:",
    acceptanceLikelihoodPrefix: "Acceptance Likelihood:",
    simulatingSpinner: "Simulating opposing counsel negotiation response...",
    expectedObjectionLabel: "Expected Counterparty Objection",
    round2RebuttalLabel: "Round-2 Rebuttal Script",
    copiedBtn: "Copied",
    copyRebuttalBtn: "Copy Rebuttal",
    fallbackCompromiseLabel: "Round-2 Fallback Compromise Wording",
    useCompromiseBtn: "Use Compromise Wording",
    reSimulateBtn: "Re-Simulate",
    compromiseAppliedToast:
      "Round-2 compromise applied to proposed wording.",
    pushbackErrorFallback: "Failed to simulate counterparty pushback.",
    verifyErrorFallback: "Critic verification check failed.",
    emptyScanTitle: "Document Graph Not Yet Scanned",
    emptyScanDesc:
      'Click "Scan Cross-Clause Integrity" above to inspect the contract for conflicting obligations, broken section numbers, and unanchored capitalized terms.',
    telemetryTokensSavedUnit: "saved",
    telemetryTokUnit: "tok",
    telemetryViewerTitle: "Viewer role cannot purge AI Semantic Cache",
    telemetryPurgeError: "Failed to purge Semantic Clause Audit Cache.",
    extractorMinCharsError:
      "Please paste at least 20 characters of golden contract text or load the sample MSA.",
    extractorNoFileError:
      "Please select a .docx or .pdf golden contract file.",
    extractorViewerTitle:
      "Viewer role cannot run Playbook Auto-Extractor",
    gutterMapLabel: "Map",
    compliantFallbackHeading: "Provision",
  },
  es: {
    copilotTitle: "Copiloto IA de Cláusulas en Línea",
    copilotSubtitle: "Dirige la redacción con instrucciones a medida",
    chipMutualLabel: "Hacer Estrictamente Mutuo",
    chipMutualPrompt:
      "Haz esta obligación estrictamente mutua y excluye daños indirectos.",
    chipCapLabel: "Tope de $100,000",
    chipCapPrompt:
      "Limita la responsabilidad agregada a $100,000 en lugar de 12 meses de tarifas.",
    chipCureLabel: "Añadir Subsanación de 30 Días",
    chipCurePrompt:
      "Agrega un preaviso escrito de 30 días y período de subsanación antes de rescindir.",
    chipSoftenLabel: "Suavizar Tono Estratégico",
    chipSoftenPrompt:
      "Suaviza el tono legal para un socio estratégico manteniendo la protección de PI.",
    copilotPlaceholder:
      "p. ej., Limita la responsabilidad a $100,000 y agrega 30 días de subsanación...",
    copilotClose: "Cerrar",
    copilotRefining: "Refinando...",
    copilotRefineBtn: "Refinar con IA",
    copilotSuccessFallback: "¡Cláusula refinada con éxito!",
    copilotErrorFallback: "No se pudo refinar la cláusula.",
    pushbackTitle: "Simulador de Objeciones y Estrategia de Ronda 2",
    simulatedPersonaPrefix: "Perfil Simulado:",
    acceptanceLikelihoodPrefix: "Prob. de Aceptación:",
    simulatingSpinner: "Simulando respuesta negociadora de la contraparte...",
    expectedObjectionLabel: "Objeción Esperada de la Contraparte",
    round2RebuttalLabel: "Guion de Réplica — Ronda 2",
    copiedBtn: "Copiado",
    copyRebuttalBtn: "Copiar Réplica",
    fallbackCompromiseLabel: "Redacción de Compromiso Alternativo — Ronda 2",
    useCompromiseBtn: "Usar Redacción de Compromiso",
    reSimulateBtn: "Re-simular",
    compromiseAppliedToast:
      "Compromiso de Ronda 2 aplicado al texto propuesto.",
    pushbackErrorFallback: "Error al simular objeción de la contraparte.",
    verifyErrorFallback: "Error en la verificación del Agente Critic.",
    emptyScanTitle: "Grafo Documental Aún No Escaneado",
    emptyScanDesc:
      'Haz clic en "Escanear Integridad Cruzada" arriba para inspeccionar obligaciones contradictorias, secciones rotas y términos en mayúsculas sin definir.',
    telemetryTokensSavedUnit: "ahorrados",
    telemetryTokUnit: "tok",
    telemetryViewerTitle: "El rol Lector no puede purgar la caché semántica IA",
    telemetryPurgeError: "Error al purgar la Caché Semántica de Auditoría.",
    extractorMinCharsError:
      "Pega al menos 20 caracteres del contrato modelo o carga el MSA de muestra.",
    extractorNoFileError:
      "Selecciona un archivo .docx o .pdf de contrato modelo.",
    extractorViewerTitle:
      "El rol Lector no puede ejecutar el Extractor IA de Playbook",
    gutterMapLabel: "Mapa",
    compliantFallbackHeading: "Disposición",
  },
  fr: {
    copilotTitle: "Copilote IA de Clause en Ligne",
    copilotSubtitle: "Orientez la rédaction par consigne sur mesure",
    chipMutualLabel: "Rendre Strictement Réciproque",
    chipMutualPrompt:
      "Rendez cette obligation strictement réciproque et excluez les dommages indirects.",
    chipCapLabel: "Plafonner à 100 000 $",
    chipCapPrompt:
      "Plafonnez la responsabilité cumulée à 100 000 $ au lieu de 12 mois de redevances.",
    chipCureLabel: "Ajouter Remédiation 30 Jours",
    chipCurePrompt:
      "Ajoutez un préavis écrit de 30 jours avec délai de remédiation avant toute résiliation.",
    chipSoftenLabel: "Adoucir pour Partenaire",
    chipSoftenPrompt:
      "Adoucissez le ton juridique pour un partenaire stratégique tout en protégeant la PI.",
    copilotPlaceholder:
      "ex. : Plafonner la responsabilité à 100 000 $ avec un délai de remédiation de 30 jours...",
    copilotClose: "Fermer",
    copilotRefining: "Affinage...",
    copilotRefineBtn: "Affiner avec l'IA",
    copilotSuccessFallback: "Clause affinée avec succès !",
    copilotErrorFallback: "Échec de l'affinage de la clause.",
    pushbackTitle: "Simulateur d'Objections & Stratégie Tour 2",
    simulatedPersonaPrefix: "Profil Simulé :",
    acceptanceLikelihoodPrefix: "Prob. d'Acceptation :",
    simulatingSpinner: "Simulation de la réponse du conseil adverse...",
    expectedObjectionLabel: "Objection Attendue de la Contrepartie",
    round2RebuttalLabel: "Argumentaire de Réfutation — Tour 2",
    copiedBtn: "Copié",
    copyRebuttalBtn: "Copier la Réfutation",
    fallbackCompromiseLabel: "Formulation de Compromis — Tour 2",
    useCompromiseBtn: "Utiliser le Compromis",
    reSimulateBtn: "Re-simuler",
    compromiseAppliedToast:
      "Compromis Tour 2 appliqué à la formulation proposée.",
    pushbackErrorFallback: "Échec de la simulation d'objection adverse.",
    verifyErrorFallback: "Échec de la vérification Critic.",
    emptyScanTitle: "Graphe Documentaire Non Encore Analysé",
    emptyScanDesc:
      'Cliquez sur « Analyser l’Intégrité Croisée » ci-dessus pour détecter obligations contradictoires, renvois cassés et termes non définis.',
    telemetryTokensSavedUnit: "économisés",
    telemetryTokUnit: "jetons",
    telemetryViewerTitle: "Le rôle Lecteur ne peut pas purger le cache sémantique IA",
    telemetryPurgeError: "Échec de la purge du Cache Sémantique d'Audit.",
    extractorMinCharsError:
      "Veuillez coller au moins 20 caractères du contrat modèle ou charger l'exemple MSA.",
    extractorNoFileError:
      "Veuillez sélectionner un fichier .docx ou .pdf de contrat modèle.",
    extractorViewerTitle:
      "Le rôle Lecteur ne peut pas exécuter l'Extracteur IA de Playbook",
    gutterMapLabel: "Carte",
    compliantFallbackHeading: "Stipulation",
  },
};

export const SAMPLE_GOLDEN_CONTRACT_TEXT_BY_LOCALE: Record<
  SupportedLocale,
  string
> = {
  en: `1. Limitation of Liability. Except for confidentiality and IP indemnification breaches, neither party's aggregate cumulative liability shall exceed the total fees paid by Customer in the twelve (12) months immediately preceding the claim, and neither party shall be liable for indirect, special, or consequential damages.

2. Data Privacy & AI Safeguards. Vendor shall maintain strict GDPR and CCPA data processing safeguards, shall never use Customer Data or Customer Confidential Information to train public or third-party AI foundation models, and shall notify Customer within 24 hours of any confirmed security breach.

3. Service Level Agreement (SLA). Vendor guarantees a minimum 99.9% monthly production uptime availability excluding scheduled maintenance, backed by tiered monthly service credits up to 25% and termination rights for chronic SLA misses.

4. Term and Termination Notice. Either party may terminate for material breach only after providing at least 30 days prior written notice specifying the breach with a full 30-day opportunity to cure, and Vendor shall refund any prepaid unused subscription fees on a pro-rata basis.`,
  es: `1. Limitación de Responsabilidad. Salvo incumplimientos de confidencialidad e indemnización de PI, la responsabilidad acumulada total de ninguna de las partes excederá las tarifas pagadas por el Cliente en los doce (12) meses inmediatamente anteriores a la reclamación, y ninguna parte será responsable por daños indirectos, especiales o consecuentes.

2. Privacidad de Datos y Salvaguardas de IA. El Proveedor mantendrá estrictas salvaguardas de tratamiento conforme al RGPD y CCPA, nunca utilizará Datos del Cliente ni Información Confidencial para entrenar modelos fundacionales de IA públicos o de terceros, y notificará al Cliente en un plazo de 24 horas ante cualquier brecha de seguridad confirmada.

3. Acuerdo de Nivel de Servicio (SLA). El Proveedor garantiza un mínimo del 99,9% de disponibilidad mensual en producción excluyendo mantenimiento programado, respaldado por créditos mensuales escalonados de hasta el 25% y derecho de rescisión ante fallos crónicos del SLA.

4. Vigencia y Preaviso de Rescisión. Cualquiera de las partes podrá rescindir por incumplimiento sustancial únicamente tras otorgar al menos 30 días de preaviso por escrito especificando el incumplimiento con oportunidad plena de subsanación durante 30 días, reembolsando las tarifas prepagadas no devengadas a prorrata.`,
  fr: `1. Limitation de Responsabilité. Sous réserve des manquements à la confidentialité et à l'indemnisation de PI, la responsabilité cumulée totale de chaque partie n'excédera pas le montant total des redevances payées par le Client au cours des douze (12) mois précédant immédiatement la réclamation, aucune partie n'étant responsable des dommages indirects, spéciaux ou consécutifs.

2. Confidentialité des Données et Garanties IA. Le Fournisseur maintiendra des garanties strictes conformes au RGPD et au CCPA, n'utilisera jamais les Données Client ou Informations Confidentielles pour entraîner des modèles d'IA publics ou tiers, et notifiera le Client sous 24 heures de toute violation de sécurité confirmée.

3. Accord de Niveau de Service (SLA). Le Fournisseur garantit une disponibilité mensuelle minimale de 99,9 % en production hors maintenance planifiée, assortie de crédits mensuels progressifs jusqu'à 25 % et d'un droit de résiliation en cas de manquements chroniques au SLA.

4. Durée et Préavis de Résiliation. Chaque partie ne pourra résilier pour manquement substantiel qu'après avoir adressé un préavis écrit d'au moins 30 jours précisant le manquement avec un délai complet de remédiation de 30 jours, le Fournisseur remboursant au prorata les redevances prépayées non consommées.`,
};
