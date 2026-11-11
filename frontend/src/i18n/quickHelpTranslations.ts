import type { SupportedLocale } from "./translations";

export interface QuickHelpCardItem {
  title: string;
  body: string;
  highlight?: string;
}

export interface QuickHelpBodyTranslations {
  copilot: {
    heading: string;
    badge: string;
    introPrefix: string;
    introStrong: string;
    introSuffix: string;
    chips: QuickHelpCardItem[];
    footerTitle: string;
    footerPrefix: string;
    footerCode: string;
    footerSuffix: string;
  };
  radar: {
    heading: string;
    badge: string;
    introPrefix: string;
    introStrong: string;
    introSuffix: string;
    categories: [QuickHelpCardItem, QuickHelpCardItem, QuickHelpCardItem];
    footerTitle: string;
    footerBeforeSource: string;
    footerSourceBtn: string;
    footerBetween: string;
    footerTargetBtn: string;
    footerAfterTarget: string;
  };
  critic: {
    heading: string;
    badge: string;
    introPrefix: string;
    introStrong1: string;
    introMiddle: string;
    introStrong2: string;
    introSuffix: string;
    gates: [QuickHelpCardItem, QuickHelpCardItem, QuickHelpCardItem];
    footerTitle: string;
    footerVerifiedStrong: string;
    footerVerifiedText: string;
    footerRefinedStrong: string;
    footerRefinedText: string;
    footerReviewStrong: string;
    footerReviewText: string;
    footerReverifyStrong: string;
    footerReverifySuffix: string;
  };
  pushback: {
    heading: string;
    badge: string;
    introPrefix: string;
    introStrong: string;
    introSuffix: string;
    card1Title: string;
    card1Prefix: string;
    card1Range: string;
    card1Suffix: string;
    card2Title: string;
    card2Prefix: string;
    card2Strong: string;
    card2Suffix: string;
    footerTitle: string;
    footerPrefix: string;
    footerStrong: string;
    footerMiddle: string;
    footerSuffix: string;
  };
  stance: {
    strictTitle: string;
    strictBadge: string;
    strictPrefix: string;
    strictCode: string;
    strictSuffix: string;
    balancedTitle: string;
    balancedBadge: string;
    balancedPrefix: string;
    balancedCode: string;
    balancedSuffix: string;
    commercialTitle: string;
    commercialBadge: string;
    commercialPrefix: string;
    commercialCode: string;
    commercialSuffix: string;
  };
  heatmap: {
    diffTitle: string;
    diffHoverPrefix: string;
    diffApplyLabel: string;
    diffToPreview: string;
    diffDeleted: string;
    diffAnd: string;
    diffInserted: string;
    diffSuffix: string;
  };
  exportTab: {
    trackChangesPrefix: string;
    cleanCopyPrefix: string;
  };
  extractor: {
    heading: string;
    linkLabel: string;
    introOpen: string;
    introMiddle: string;
    introSample: string;
    introUpload: string;
    card1Title: string;
    card1Prefix: string;
    card1Strong: string;
    card1Suffix: string;
    card2Title: string;
    card2Prefix: string;
    card2Strong: string;
    card2Suffix: string;
  };
  telemetry: {
    heading: string;
    badge: string;
    introOpen: string;
    introStrong: string;
    introSuffix: string;
    card1Title: string;
    card1Prefix: string;
    card1Suffix: string;
    card2Title: string;
    card2Prefix: string;
    card2Strong: string;
    card2Suffix: string;
  };
  footer: {
    openFullGuide: string;
    gotIt: string;
  };
}

export const QUICK_HELP_BODY_COPY: Record<
  SupportedLocale,
  QuickHelpBodyTranslations
> = {
  en: {
    copilot: {
      heading: "Inline Clause AI Copilot & Custom Prompting",
      badge: "COPILOT",
      introPrefix: "Steer AI redlining on any individual clause. Click the ",
      introStrong: "✨ AI Copilot",
      introSuffix:
        " button on any redline card to open the copilot drawer with one-click quick directive chips or type custom natural-language instructions.",
      chips: [
        {
          title: "Make Strictly Mutual",
          body: 'Converts unilateral covenants into bilateral obligations ("Each party shall...") and carves out indirect or consequential damages.',
        },
        {
          title: "Cap Liability at $100,000",
          body: "Replaces fee-multiple formulas with an explicit, predictable dollar ceiling ($100,000) for aggregate commercial exposure.",
        },
        {
          title: "Add 30-Day Cure Period",
          body: "Inserts standard written notice and a 30-day opportunity to cure prior to any termination for cause or service cancellation.",
        },
        {
          title: "Soften Tone for Partner",
          body: "Softens contentious language while preserving core IP and confidentiality boundaries—ideal for strategic alliance negotiations.",
        },
      ],
      footerTitle: "Compliance Audit Trail Guarantee",
      footerPrefix: "Every refinement logs an immutable ",
      footerCode: "SUGGESTION_REFINED",
      footerSuffix:
        " event with the exact prompt instruction, actor role, timestamp, and generated rationale.",
    },
    radar: {
      heading: "Cross-Clause Integrity & Contradiction Radar",
      badge: "RADAR",
      introPrefix:
        "Evaluates the entire contract graph to catch multi-clause structural conflicts that single-clause redlines miss. Switch to the ",
      introStrong: "Cross-Clause Radar",
      introSuffix:
        " tab in the right-hand Inspector to trigger or view real-time diagnostics.",
      categories: [
        {
          title: "Contradictions",
          body: "Opposing obligations, monetary liability caps vs uncapped indemnities, or conflicting payment terms (Net 30 vs Net 15).",
        },
        {
          title: "Broken References",
          body: "Citations referencing sections, articles, or exhibits that do not exist anywhere in the agreement body.",
        },
        {
          title: "Undefined Terms",
          body: "Capitalized terms used in operative commitments without prior definitions in the preamble or Section 1.",
        },
      ],
      footerTitle: "Dynamic Document Integrity Score (0-100%) & Clause Navigation",
      footerBeforeSource:
        "Starts at 100% and deducts weighted penalties for each unresolved issue. Click the interactive ",
      footerSourceBtn: "Source: Clause #X",
      footerBetween: " and ",
      footerTargetBtn: "Conflicts with: Clause #Y",
      footerAfterTarget:
        " jump buttons to instantly highlight and scroll to either clause in the live editor.",
    },
    critic: {
      heading: "Critic-Refiner Multi-Agent Loop & Hallucination Guard",
      badge: "AGENT 2 GUARD",
      introPrefix: "Every redline runs through a 2-agent pipeline: ",
      introStrong1: "Agent 1",
      introMiddle: " drafts the proposed revision and ",
      introStrong2: "Agent 2 (Critic Verifier)",
      introSuffix:
        " enforces 3 safety gates and auto-repairs defects before display.",
      gates: [
        {
          title: "✓ Policy Grounded",
          body: "Ensures zero banned Playbook triggers leak into the proposed text and aligns wording with standard/fallback rules.",
        },
        {
          title: "✓ Hallucination-Free",
          body: "Scrubs LLM placeholder tokens ([TBD], [INSERT]) and ungrounded concessions.",
        },
        {
          title: "✓ Numbering Preserved",
          body: "Restores clause numbering prefixes (e.g., 1.1) if omitted so Word Track Changes stays aligned.",
        },
      ],
      footerTitle: "Verification Badges & On-Demand Re-Verification",
      footerVerifiedStrong: "🛡️ Verified",
      footerVerifiedText: " (85–99%), ",
      footerRefinedStrong: "✨ Auto-Refined",
      footerRefinedText: " (auto-repaired by Agent 2), or ",
      footerReviewStrong: "⚠️ Review Needed",
      footerReviewText:
        " (<75%). After custom edits or Copilot refinements, click ",
      footerReverifyStrong: "Re-Verify with Critic",
      footerReverifySuffix: " to validate and log ",
    },
    pushback: {
      heading: "Counterparty Pushback Simulator & Round-2 Strategy",
      badge: "ADVERSARIAL PREP",
      introPrefix: "Click ",
      introStrong: "🎯 Simulate Pushback",
      introSuffix:
        " on any redline card to simulate how opposing counsel will push back before circulating redlines externally.",
      card1Title: "Acceptance Probability & Severity",
      card1Prefix: "Forecasts ",
      card1Range: "0–100% Acceptance Likelihood",
      card1Suffix:
        " classified as LOW (>=75%), MODERATE (50–74%), HIGH (25–49%), or DEALBREAKER (<25%).",
      card2Title: "Objection & Copy Rebuttal Script",
      card2Prefix:
        "Predicts opposing counsel's strongest objection and supplies a ready-to-copy ",
      card2Strong: "Round-2 Rebuttal Script",
      card2Suffix: " grounded in commercial parity.",
      footerTitle: "One-Click Round-2 Pivot: Use Compromise Wording",
      footerPrefix: "Click ",
      footerStrong: "Use Compromise Wording",
      footerMiddle:
        " to load the section-numbered Round-2 middle-ground fallback directly into Proposed Playbook Wording for immediate diff preview and ",
      footerSuffix: " audit logging.",
    },
    stance: {
      strictTitle: "Strict Posture (Zero Compromise)",
      strictBadge: "STRICT",
      strictPrefix:
        "Strictly enforces your organization's standard position. Escalates borderline risks to Critical/High, prefixes rationales with ",
      strictCode: "[Strict Protective Stance]",
      strictSuffix:
        ", and crafts firm, non-negotiable talking points. Best for high-liability infrastructure and core IP.",
      balancedTitle: "Balanced Posture (Reciprocal Bilateral — Default)",
      balancedBadge: "BALANCED",
      balancedPrefix:
        'Converts one-sided clauses into fair, mutual ("Each party...") terms while defending core corporate boundaries. Rationale is prefixed with ',
      balancedCode: "[Balanced Mutual Stance]",
      balancedSuffix: ". Standard for 80% of routine commercial transactions.",
      commercialTitle: "Commercial Posture (Fast-Close Deal Velocity)",
      commercialBadge: "COMMERCIAL",
      commercialPrefix:
        "Prioritizes deal closing velocity. Automatically adopts pre-approved fallback positions from your Playbook (e.g., 2x fee cap instead of strict 12-month cap), marks acceptable fallback provisions compliant, prefixes rationales with ",
      commercialCode: "[Commercial Fast-Close Stance]",
      commercialSuffix: ", and crafts deal-closing talking points.",
    },
    heatmap: {
      diffTitle: "Live Word-Level Diff Preview",
      diffHoverPrefix: "Hover over ",
      diffApplyLabel: "Apply Redline",
      diffToPreview: " to preview ",
      diffDeleted: "deleted words",
      diffAnd: " and ",
      diffInserted: "inserted Playbook words",
      diffSuffix:
        " directly inside the contract sheet before committing.",
    },
    exportTab: {
      trackChangesPrefix: "Track Changes (.docx):",
      cleanCopyPrefix: "Clean (.docx):",
    },
    extractor: {
      heading: "Golden Contract to Playbook Rules (AI Feature #6)",
      linkLabel: "Playbooks Manager",
      introOpen: "Open ",
      introMiddle: " to paste signed Golden Contract clauses (or click ",
      introSample: "Load Sample Golden MSA",
      introUpload: ") or upload a .docx/.pdf template.",
      card1Title: "Auto-Save & 1536-d Indexing (ADMIN)",
      card1Prefix: "Keep ",
      card1Strong: "Auto-save & generate vectors",
      card1Suffix:
        " checked to immediately persist extracted Standard/Fallback positions and Triggers into your hybrid search Playbook.",
      card2Title: "Safe Preview Mode (Legal / Tech Lead)",
      card2Prefix:
        "Uncheck auto-save to preview extracted candidates with confidence scores and source excerpts first, then selectively click ",
      card2Strong: "Save Rule",
      card2Suffix: ".",
    },
    telemetry: {
      heading: "Semantic Clause Audit Cache & FinOps Telemetry (Feature #7)",
      badge: "<1ms Cache Hit",
      introOpen: "Open the ",
      introStrong: "⚡ AI Telemetry",
      introSuffix:
        " tab in the right Inspector to monitor real-time cache hit rates, tokens saved, average latency, avoided USD spend, and per-operation metrics.",
      card1Title: "Automatic Freshness Keying",
      card1Prefix: "SHA-256 keys include org_id",
      card1Suffix:
        ", clause text, Negotiation Stance, Playbook rules, and active provider/model — changing any input automatically triggers a fresh inference.",
      card2Title: "Purge Semantic Cache",
      card2Prefix:
        "Switching AI models clears cached entries automatically, or ADMIN / Legal / Tech Lead reviewers can click ",
      card2Strong: "Purge Semantic Cache",
      card2Suffix: " manually at any time.",
    },
    footer: {
      openFullGuide: "Open Full Help Center & Playbook Templates",
      gotIt: "Got It",
    },
  },
  es: {
    copilot: {
      heading: "Copiloto IA por Cláusula e Instrucciones Personalizadas",
      badge: "COPILOTO IA",
      introPrefix:
        "Dirige las revisiones IA en cualquier cláusula individual. Haz clic en ",
      introStrong: "✨ Copiloto IA",
      introSuffix:
        " en cualquier tarjeta para abrir los chips rápidos de directiva o escribir instrucciones personalizadas en lenguaje natural.",
      chips: [
        {
          title: "Hacer Estrictamente Mutuo",
          body: 'Convierte cláusulas unilaterales en compromisos bilaterales ("Cada parte...") y excluye daños indirectos o consecuentes.',
        },
        {
          title: "Limitar Responsabilidad a $100,000",
          body: "Sustituye fórmulas múltiples de tarifa por un tope monetario fijo y predecible ($100,000) para la exposición comercial agregada.",
        },
        {
          title: "Añadir Plazo de Subsanación de 30 Días",
          body: "Inserta notificación previa por escrito y 30 días de oportunidad de subsanación antes de cualquier rescisión por causa.",
        },
        {
          title: "Suavizar Tono para Socio Estratégico",
          body: "Suaviza el lenguaje conflictivo preservando la protección nuclear de PI y confidencialidad — ideal para alianzas.",
        },
      ],
      footerTitle: "Garantía de Trazabilidad e Inmutabilidad",
      footerPrefix: "Cada refinamiento registra un evento inmutable ",
      footerCode: "SUGGESTION_REFINED",
      footerSuffix:
        " con la instrucción exacta, rol del usuario, marca temporal y argumento generado.",
    },
    radar: {
      heading: "Radar de Integridad y Contradicciones Cruzadas",
      badge: "RADAR",
      introPrefix:
        "Evalúa todo el grafo contractual para detectar conflictos estructurales entre cláusulas que el análisis individual pasa por alto. Abre la pestaña ",
      introStrong: "Radar",
      introSuffix:
        " en el Inspector derecho para ejecutar o revisar diagnósticos en vivo.",
      categories: [
        {
          title: "Contradicciones",
          body: "Obligaciones opuestas, topes de responsabilidad frente a indemnidades ilimitadas o plazos de pago incompatibles (Net 30 vs Net 15).",
        },
        {
          title: "Referencias Rotas",
          body: "Citas que remiten a secciones, artículos o anexos inexistentes en el texto del contrato.",
        },
        {
          title: "Términos Sin Definir",
          body: "Términos en mayúsculas usados en obligaciones operativas sin definición previa en el preámbulo o Sección 1.",
        },
      ],
      footerTitle: "Índice Dinámico de Integridad (0–100%) y Salto entre Cláusulas",
      footerBeforeSource:
        "Parte de 100% y aplica deducciones ponderadas por cada hallazgo sin resolver. Haz clic en ",
      footerSourceBtn: "Origen: Cláusula #X",
      footerBetween: " y ",
      footerTargetBtn: "Conflicto con: Cláusula #Y",
      footerAfterTarget:
        " para resaltar y desplazarte al instante hacia cualquiera de las dos cláusulas en el editor.",
    },
    critic: {
      heading: "Bucle Crítico-Refinador Multiagente y Guardia Anti-Alucinaciones",
      badge: "GUARDIA AGENTE 2",
      introPrefix: "Toda propuesta pasa por un flujo dual: el ",
      introStrong1: "Agente 1",
      introMiddle: " redacta la modificación y el ",
      introStrong2: "Agente 2 (Verificador Crítico)",
      introSuffix:
        " aplica 3 filtros de seguridad y corrige fallos antes de mostrarla.",
      gates: [
        {
          title: "✓ Basado en Política",
          body: "Garantiza cero frases bloqueantes heredadas y alinea el texto con las reglas estándar/alternativas.",
        },
        {
          title: "✓ Sin Alucinaciones",
          body: "Elimina marcadores ficticios del modelo ([TBD], [INSERT]) y concesiones no respaldadas.",
        },
        {
          title: "✓ Numeración Preservada",
          body: "Restaura prefijos numéricos legales (ej. 1.1) para mantener alineado el Control de Cambios en Word.",
        },
      ],
      footerTitle: "Insignias de Verificación y Reverificación Bajo Demanda",
      footerVerifiedStrong: "🛡️ Verificado",
      footerVerifiedText: " (85–99%), ",
      footerRefinedStrong: "✨ Auto-Refinado",
      footerRefinedText: " (reparado por Agente 2), o ",
      footerReviewStrong: "⚠️ Revisión Requerida",
      footerReviewText:
        " (<75%). Tras editar manualmente o usar el Copiloto, pulsa ",
      footerReverifyStrong: "Reverificar con Crítico",
      footerReverifySuffix: " para validar y registrar ",
    },
    pushback: {
      heading: "Simulador de Objeciones de Contraparte y Estrategia Ronda 2",
      badge: "MODO ADVERSARIAL",
      introPrefix: "Haz clic en ",
      introStrong: "🎯 Simular Objeción",
      introSuffix:
        " en cualquier tarjeta para anticipar cómo objetará el abogado contrario antes de circular los cambios.",
      card1Title: "Probabilidad de Aceptación y Severidad",
      card1Prefix: "Pronostica ",
      card1Range: "0–100% Probabilidad de Aceptación",
      card1Suffix:
        " clasificada como LOW (>=75%), MODERATE (50–74%), HIGH (25–49%) o DEALBREAKER (<25%).",
      card2Title: "Objeción Prevista y Guion de Réplica",
      card2Prefix:
        "Anticipa la objeción principal de la contraparte y entrega un ",
      card2Strong: "Guion de Réplica Ronda 2",
      card2Suffix: " listo para copiar con equidad comercial.",
      footerTitle: "Giro en Un Clic: Usar Redacción de Compromiso",
      footerPrefix: "Pulsa ",
      footerStrong: "Usar Redacción de Compromiso",
      footerMiddle:
        " para cargar la cláusula alternativa intermedia de Ronda 2 (con su numeración legal) directamente en el borrador y registrar ",
      footerSuffix: " en auditoría.",
    },
    stance: {
      strictTitle: "Postura Estricta (Cero Concesiones)",
      strictBadge: "ESTRICTO",
      strictPrefix:
        "Aplica sin concesiones la posición estándar corporativa. Eleva riesgos límite a Crítico/Alto, etiqueta la justificación como ",
      strictCode: "[Postura Estricta Protectora]",
      strictSuffix:
        " y genera argumentos firmes no negociables. Ideal para infraestructura crítica y PI clave.",
      balancedTitle: "Postura Equilibrada (Bilateral Recíproca — Predeterminada)",
      balancedBadge: "EQUILIBRADO",
      balancedPrefix:
        'Transforma cláusulas unilaterales en términos recíprocos ("Cada parte...") protegiendo límites clave bajo ',
      balancedCode: "[Postura Mutua Equilibrada]",
      balancedSuffix: ". Estándar para el 80% de transacciones comerciales habituales.",
      commercialTitle: "Postura Comercial (Cierre Rápido de Acuerdos)",
      commercialBadge: "COMERCIAL",
      commercialPrefix:
        "Prioriza la velocidad de firma. Adopta automáticamente posiciones alternativas preaprobadas del Playbook (ej. límite 2x), reduce fricción y etiqueta con ",
      commercialCode: "[Postura Comercial Ágil]",
      commercialSuffix: " para agilizar la negociación.",
    },
    heatmap: {
      diffTitle: "Previsualización de Cambios Palabra por Palabra",
      diffHoverPrefix: "Sitúa el cursor sobre ",
      diffApplyLabel: "Aplicar Cambio",
      diffToPreview: " para previsualizar ",
      diffDeleted: "palabras eliminadas",
      diffAnd: " y ",
      diffInserted: "palabras del Playbook añadidas",
      diffSuffix: " directamente en el documento antes de confirmar.",
    },
    exportTab: {
      trackChangesPrefix: "Control Cambios (.docx):",
      cleanCopyPrefix: "Copia Limpia (.docx):",
    },
    extractor: {
      heading: "Contrato Modelo a Reglas de Playbook (Función IA #6)",
      linkLabel: "Gestor de Políticas",
      introOpen: "Abre el ",
      introMiddle: " para pegar cláusulas de un Contrato Modelo firmado (o pulsa ",
      introSample: "Cargar MSA Modelo Ejemplo",
      introUpload: ") o subir una plantilla .docx/.pdf.",
      card1Title: "Guardado e Indexación 1536-d (ADMIN)",
      card1Prefix: "Mantén ",
      card1Strong: "Guardar e indexar al Playbook",
      card1Suffix:
        " activado para guardar de inmediato posiciones estándar/alternativas y frases prohibidas en búsqueda híbrida.",
      card2Title: "Modo Vista Previa Segura (Legal / Tech Lead)",
      card2Prefix:
        "Desmarca guardado automático para revisar primero candidatos con puntuación de confianza y pulsar ",
      card2Strong: "+ Guardar al Playbook",
      card2Suffix: ".",
    },
    telemetry: {
      heading: "Caché Semántica y Telemetría FinOps IA (Función #7)",
      badge: "Acierto <1ms",
      introOpen: "Abre la pestaña ",
      introStrong: "⚡ Telemetría IA",
      introSuffix:
        " en el Inspector derecho para supervisar tasa de caché, tokens ahorrados, latencia media y ahorro USD evitado.",
      card1Title: "Frescura Automática por Hash SHA-256",
      card1Prefix: "Las claves SHA-256 combinan org_id",
      card1Suffix:
        ", texto de cláusula, Postura de Negociación, reglas del Playbook y modelo LLM activo; cualquier cambio recalcula al instante.",
      card2Title: "Purgar Caché Semántica",
      card2Prefix:
        "Al cambiar de modelo la caché se limpia sola, o revisores autorizados pueden pulsar ",
      card2Strong: "Purgar Caché Semántica",
      card2Suffix: " manualmente en cualquier momento.",
    },
    footer: {
      openFullGuide: "Abrir Centro de Ayuda Completo y Plantillas",
      gotIt: "Entendido",
    },
  },
  fr: {
    copilot: {
      heading: "Copilote IA par Clause & Instructions Libres",
      badge: "COPILOTE IA",
      introPrefix:
        "Pilotez la rédaction IA sur chaque clause individuellement. Cliquez sur ",
      introStrong: "✨ Copilote IA",
      introSuffix:
        " sur n'importe quelle carte pour utiliser nos raccourcis en un clic ou saisir des directives en langage naturel.",
      chips: [
        {
          title: "Rendre Strictement Mutuel",
          body: 'Convertit les clauses unilatérales en obligations bilatérales (« Chaque partie... ») et exclut les dommages indirects.',
        },
        {
          title: "Plafonner à 100 000 $",
          body: "Remplace les multiples d'honoraires par un plafond monétaire fixe et prévisible (100 000 $) sur l'exposition globale.",
        },
        {
          title: "Ajouter un Préavis de 30 Jours",
          body: "Insère un préavis écrit et un délai de remédiation de 30 jours avant toute résiliation pour manquement.",
        },
        {
          title: "Adoucir le Ton Partenaire",
          body: "Assouplit le style tout en préservant les garanties clés de PI et de confidentialité — idéal pour les alliances stratégiques.",
        },
      ],
      footerTitle: "Traçabilité Garantie dans le Journal d'Audit",
      footerPrefix: "Chaque affinement consigne un événement immuable ",
      footerCode: "SUGGESTION_REFINED",
      footerSuffix:
        " avec l'instruction exacte, le rôle du réviseur, l'horodatage et l'argumentaire produit.",
    },
    radar: {
      heading: "Radar d'Intégrité & Contradictions Inter-Clauses",
      badge: "RADAR",
      introPrefix:
        "Analyse le graphe complet du contrat pour repérer les conflits transverses invisibles à l'échelle d'un paragraphe. Ouvrez l'onglet ",
      introStrong: "Radar",
      introSuffix:
        " dans l'Inspecteur droit pour lancer ou inspecter le diagnostic.",
      categories: [
        {
          title: "Contradictions",
          body: "Engagements incompatibles, plafonds face à des garanties illimitées ou délais de paiement divergents (Net 30 vs Net 15).",
        },
        {
          title: "Renvois Cassés",
          body: "Citations renvoyant vers des sections, articles ou annexes absents du corps du contrat.",
        },
        {
          title: "Termes Non Définis",
          body: "Termes avec majuscules employés dans des obligations sans définition préalable en préambule ou Section 1.",
        },
      ],
      footerTitle: "Score d'Intégrité (0–100 %) & Saut Entre Clauses",
      footerBeforeSource:
        "Part de 100 % avec déductions pondérées selon la gravité. Cliquez sur ",
      footerSourceBtn: "Source : Clause #X",
      footerBetween: " et ",
      footerTargetBtn: "Conflit avec : Clause #Y",
      footerAfterTarget:
        " pour surligner et défiler immédiatement vers chaque clause concernée.",
    },
    critic: {
      heading: "Boucle Multi-Agents Critique-Raffineur & Garde Anti-Hallucinations",
      badge: "GARDE AGENT 2",
      introPrefix: "Chaque révision suit un double pipeline : l'",
      introStrong1: "Agent 1",
      introMiddle: " rédige la proposition et l'",
      introStrong2: "Agent 2 (Garde Critique)",
      introSuffix:
        " vérifie 3 barrières de sécurité et répare automatiquement tout défaut.",
      gates: [
        {
          title: "✓ Conforme Politique",
          body: "Bloque toute fuite de termes interdits et aligne la clause sur les règles standard/repli.",
        },
        {
          title: "✓ Sans Hallucination",
          body: "Élimine tout jeton fictif du LLM ([TBD], [INSERT]) ou concession infondée.",
        },
        {
          title: "✓ Numérotation Préservée",
          body: "Restaure les préfixes légaux (ex. 1.1) pour préserver l'alignement Word OpenXML.",
        },
      ],
      footerTitle: "Badges de Vérification & Revérification à la Demande",
      footerVerifiedStrong: "🛡️ Vérifié",
      footerVerifiedText: " (85–99 %), ",
      footerRefinedStrong: "✨ Auto-Affiné",
      footerRefinedText: " (corrigé par l'Agent 2), ou ",
      footerReviewStrong: "⚠️ Révision Requise",
      footerReviewText:
        " (<75 %). Après édition manuelle ou Copilote, cliquez sur ",
      footerReverifyStrong: "Revérifier avec Critique",
      footerReverifySuffix: " pour valider et journaliser ",
    },
    pushback: {
      heading: "Simulateur de Réponse Adverse & Stratégie Tour 2",
      badge: "PRÉPARATION TOUR 2",
      introPrefix: "Cliquez sur ",
      introStrong: "🎯 Simuler Réponse",
      introSuffix:
        " sur n'importe quelle fiche pour anticiper les objections du conseil adverse avant l'envoi.",
      card1Title: "Probabilité d'Acceptation & Sévérité",
      card1Prefix: "Estime la ",
      card1Range: "Probabilité d'Acceptation (0–100 %)",
      card1Suffix:
        " en LOW (>=75 %), MODERATE (50–74 %), HIGH (25–49 %) ou DEALBREAKER (<25 %).",
      card2Title: "Objection Attendue & Script Copiable",
      card2Prefix:
        "Anticipe la principale objection adverse et prépare un ",
      card2Strong: "Script de Riposte Tour 2",
      card2Suffix: " prêt à copier fondé sur la parité de marché.",
      footerTitle: "Pivot en Un Clic : Clause de Compromis",
      footerPrefix: "Cliquez sur ",
      footerStrong: "Use Compromise Wording",
      footerMiddle:
        " pour charger la formulation intermédiaire numérotée du Tour 2 dans la proposition et tracer ",
      footerSuffix: " dans le journal.",
    },
    stance: {
      strictTitle: "Posture Stricte (Zéro Compromis)",
      strictBadge: "STRICT",
      strictPrefix:
        "Applique strictement la position standard de votre entreprise. Classe les écarts en Critique/Élevé, préfixe avec ",
      strictCode: "[Posture Stricte Protectrice]",
      strictSuffix:
        " et génère des arguments fermes pour les contrats critiques d'infrastructure et PI.",
      balancedTitle: "Posture Équilibrée (Réciproque — Par Défaut)",
      balancedBadge: "ÉQUILIBRÉ",
      balancedPrefix:
        "Convertit les engagements asymétriques en clauses bilatérales (« Chaque partie... ») sous ",
      balancedCode: "[Posture Mutuelle Équilibrée]",
      balancedSuffix: ". Standard recommandé pour 80 % des accords courants.",
      commercialTitle: "Posture Commerciale (Vélocité de Signature)",
      commercialBadge: "COMMERCIAL",
      commercialPrefix:
        "Privilégie la conclusion rapide. Retient automatiquement les replis préapprouvés (ex. plafond 2x), marque les clauses acceptables conformes et préfixe avec ",
      commercialCode: "[Posture Commerciale Rapide]",
      commercialSuffix: " pour accélérer le closing.",
    },
    heatmap: {
      diffTitle: "Aperçu Mot à Mot en Direct",
      diffHoverPrefix: "Survolez ",
      diffApplyLabel: "Appliquer",
      diffToPreview: " pour prévisualiser les ",
      diffDeleted: "mots supprimés",
      diffAnd: " et les ",
      diffInserted: "mots Playbook ajoutés",
      diffSuffix: " directement dans l'acte avant validation.",
    },
    exportTab: {
      trackChangesPrefix: "Suivi Modifs (.docx) :",
      cleanCopyPrefix: "Copie Propre (.docx) :",
    },
    extractor: {
      heading: "Contrat Modèle vers Règles Playbook (Fonction IA #6)",
      linkLabel: "Gestionnaire Playbooks",
      introOpen: "Ouvrez le ",
      introMiddle: " pour coller des clauses modèles approuvées (ou cliquer sur ",
      introSample: "Charger MSA Modèle Exemple",
      introUpload: ") ou importer un fichier .docx/.pdf.",
      card1Title: "Enregistrement & Indexation 1536-d (ADMIN)",
      card1Prefix: "Laissez ",
      card1Strong: "Enregistrement & indexation auto",
      card1Suffix:
        " coché pour persister et vectoriser immédiatement positions standard/repli et déclencheurs bloquants.",
      card2Title: "Mode Aperçu Sécurisé (Juriste / Tech Lead)",
      card2Prefix:
        "Décochez l'enregistrement auto pour relire chaque candidat et cliquer sélectivement sur ",
      card2Strong: "+ Ajouter au Playbook",
      card2Suffix: ".",
    },
    telemetry: {
      heading: "Cache Sémantique & Télémétrie FinOps IA (Fonction #7)",
      badge: "Cache <1 ms",
      introOpen: "Ouvrez l'onglet ",
      introStrong: "⚡ Télémétrie IA",
      introSuffix:
        " dans l'Inspecteur droit pour suivre taux de succès cache, jetons économisés, latence et économies USD.",
      card1Title: "Fraîcheur Automatique SHA-256",
      card1Prefix: "Les clés SHA-256 combinent org_id",
      card1Suffix:
        ", texte de clause, Posture de Négociation, règles Playbook et modèle LLM actif — toute variation relance une inférence fraîche.",
      card2Title: "Purger le Cache Sémantique",
      card2Prefix:
        "Changer de modèle vide automatiquement le cache, ou les rôles autorisés peuvent cliquer sur ",
      card2Strong: "Purger le Cache Sémantique",
      card2Suffix: " manuellement.",
    },
    footer: {
      openFullGuide: "Ouvrir le Centre d'Aide Complet & Modèles",
      gotIt: "Compris",
    },
  },
  ar: {
    copilot: {
      heading: "المساعد الذكي لكل بند والتوجيه الحر",
      badge: "الأداة الذكية #2",
      introPrefix: "انقر على ",
      introStrong: "✨ المساعد الذكي",
      introSuffix:
        " داخل أي بطاقة تعديل لإعادة صياغة البند المقترح ونقطة التفاوض فورياً بتوجيهات مخصصة:",
      chips: [
        {
          title: "جعله متبادلاً بالكامل",
          body: "يحوّل الالتزامات الأحادية («يلتزم العميل...») إلى صياغة متوازنة ثنائية («يلتزم كل طرف...»).",
        },
        {
          title: "سقف مسؤولية 100,000$",
          body: "يحدّد الحد الأقصى التراكمي للمسؤولية برقم دقيق مع مراعاة قواعد الاستثناءات في Playbook.",
        },
        {
          title: "إضافة مهلة تصحيح 30 يوماً",
          body: "يُدرج إشعاراً كتابياً مسبقاً وفترة معالجة مدتها 30 يوماً قبل أي تعليق أو إنهاء.",
        },
        {
          title: "تليين النبرة لشريك استراتيجي",
          body: "يصوغ العبارات بأسلوب تعاوني بنّاء مع الحفاظ الصارم على حماية البيانات والملكية الفكرية.",
        },
      ],
      footerTitle: "التحقق والأمان التلقائي وسجل التدقيق:",
      footerPrefix:
        "يمر كل تعديل للمساعد الذكي مباشرة عبر حارس الدقة ويسجل حدث ",
      footerCode: "SUGGESTION_REFINED",
      footerSuffix: " غير قابل للتعديل في سجل الامتثال.",
    },
    radar: {
      heading: "رادار التناقضات والاتساق عبر البنود",
      badge: "الأداة الذكية #3",
      introPrefix: "افتح تبويب ",
      introStrong: "الرادار",
      introSuffix:
        " واضغط «فحص الاتساق عبر البنود» لتحليل العقد كرسم بياني كامل ورصد التعارضات الخفية:",
      categories: [
        {
          title: "التناقضات",
          body: "يكتشف تضارب الالتزامات مثل سقف 500$ مقابل تعويض غير محدود، أو شروط السداد Net 7 مقابل Net 30.",
        },
        {
          title: "الإحالات المعطلة",
          body: "يرصد الإحالات إلى أرقام أقسام مفقودة أو أُعيد ترقيمها (مثل «القسم 99.4») قبل توقيع العقد.",
        },
        {
          title: "مصطلحات غير معرّفة",
          body: "ينبّه إلى المصطلحات القانونية المميزة المستخدمة في الالتزامات دون تعريف تعاقدي مسبق.",
        },
      ],
      footerTitle: "القفز الثنائي بين البنود:",
      footerBeforeSource: "استخدم زر ",
      footerSourceBtn: "المصدر ←",
      footerBetween: " و ",
      footerTargetBtn: "يتعارض مع ←",
      footerAfterTarget: " للتنقل المباشر وحل التعارض عبر المحرر والفاحص.",
    },
    critic: {
      heading: "حلقة التحقق المتعددة الوكلاء وحارس الدقة",
      badge: "الأداة الذكية #4",
      introPrefix: "كل تعديل ينتجه ",
      introStrong1: "الوكيل 1 (المدقق والمصيغ)",
      introMiddle: " يخضع تلقائياً لمراجعة ",
      introStrong2: "الوكيل 2 (حارس الدقة ومنع الهلوسة)",
      introSuffix: " عبر 3 بوابات إلزامية:",
      gates: [
        {
          title: "✓ متوافق مع السياسة",
          body: "يتحقق من مطابقة الصياغة لسياسات Playbook ويُزيل أي عبارات مرفوضة متسربة.",
        },
        {
          title: "✓ خالٍ من الهلوسة",
          body: "يمسح أي نصوص وهمية أو نائبة مثل [TBD] أو [INSERT] أو أي التزامات غير مستندة للعقد.",
        },
        {
          title: "✓ حفظ الترقيم والالتزامات",
          body: "يضمن بقاء أرقام الأقسام (1.1، 2.1)، والنسب، والمدد الزمنية والمبالغ سليمة بدقة.",
        },
      ],
      footerTitle: "شارات الثقة والفحص عند الطلب:",
      footerVerifiedStrong: "🛡️ موثّق:",
      footerVerifiedText: "اجتاز البوابات الثلاث بنجاح.",
      footerRefinedStrong: "✨ مُحسَّن تلقائياً:",
      footerRefinedText: "أصلح الخلل واستعاد الترقيم تلقائياً.",
      footerReviewStrong: "⚠️ يحتاج مراجعة:",
      footerReviewText: "يتطلب نظرة المستشار القانوني.",
      footerReverifyStrong: "إعادة الفحص بالحارس",
      footerReverifySuffix: " متاح لإعادة التدقيق وتوثيق SUGGESTION_VERIFIED.",
    },
    pushback: {
      heading: "محاكي اعتراضات الطرف الآخر واستراتيجية الجولة الثانية",
      badge: "الأداة الذكية #5",
      introPrefix: "انقر على ",
      introStrong: "🎯 محاكاة اعتراض الطرف الآخر",
      introSuffix:
        " قبل إرسال الملاحظات لتوقّع رد محامي الطرف المقابل وتجهيز خطة الرد والتسوية مسبقاً:",
      card1Title: "احتمال القبول ودرجة الرفض",
      card1Prefix: "يعرض تقدير القبول ",
      card1Range: "0–100%",
      card1Suffix: " وتصنيف مستوى الاعتراض (منخفض، متوسط، مرتفع، عائق حاسم).",
      card2Title: "الاعتراض المتوقع ونص الرد القابل للنسخ",
      card2Prefix: "يحاكي شخصية الطرف الآخر ويجهز ",
      card2Strong: "نص الرد المخصص للجولة الثانية",
      card2Suffix: " جاهزاً للنسخ واللصق في رسائل المفاوضات.",
      footerTitle: "صياغة التسوية البديلة بنقرة واحدة:",
      footerPrefix: "يتضمن المحاكي ",
      footerStrong: "صياغة التسوية للجولة الثانية",
      footerMiddle: ". اضغط ",
      footerSuffix: "لتحديث المقترح فوراً مع الحفاظ على الترقيم قبل الاعتماد.",
    },
    stance: {
      strictTitle: "صارم — حماية قانونية دون تنازلات",
      strictBadge: "ضوابط قصوى",
      strictPrefix: "يطبق حرفياً الموقف القياسي ",
      strictCode: "standard_position",
      strictSuffix:
        " دون أي تنازلات (سقف 12 شهراً دون استثناءات، حماية قصوى للملكية الفكرية، توافر 99.99%).",
      balancedTitle: "متوازن — المعايير الثنائية العادلة (الافتراضية)",
      balancedBadge: "توازن متبادل",
      balancedPrefix: "يعتمد صياغة ثنائية عادلة ومتكافئة (",
      balancedCode: "«يلتزم كل طرف...»",
      balancedSuffix:
        ") تحمي الحدود الجوهرية للشركة مع قبول الطرف الآخر لها.",
      commercialTitle: "تجاري — أقصى سرعة للإغلاق",
      commercialBadge: "تسهيل الصفقات",
      commercialPrefix: "يعتمد فوراً المواقف البديلة المعتمدة مسبقاً ",
      commercialCode: "fallback_position",
      commercialSuffix:
        " (مثل سقف 2× الرسوم السنوية) لتقليص جولات التفاوض وإغلاق العقود بسرعة.",
    },
    heatmap: {
      diffTitle: "معاينة الفروقات كلمة بكلمة عند التمرير",
      diffHoverPrefix: "مرّر المؤشر فوق ",
      diffApplyLabel: "تطبيق التعديل",
      diffToPreview: " لمعاينة ",
      diffDeleted: "الكلمات المحذوفة بالأحمر المشطوب",
      diffAnd: " و ",
      diffInserted: "الإضافات الجديدة بالأخضر",
      diffSuffix: " مباشرة داخل البند قبل اعتماده.",
    },
    exportTab: {
      trackChangesPrefix: "استخدمه لمراجعات المحامين (وسوم OpenXML أصلية ",
      cleanCopyPrefix: "يُنتج نصاً نهائياً نظيفاً خالياً من وسوم التتبع ",
    },
    extractor: {
      heading: "تحويل العقد القياسي إلى قواعد Playbook (الميزة #6)",
      linkLabel: "إدارة السياسات ←",
      introOpen: "في ",
      introMiddle: " استخدم ",
      introSample: "تحميل عقد MSA قياسي نموذجي",
      introUpload: "أو ارفع ملف .docx/.pdf معتمد لاستخلاص القواعد تلقائياً:",
      card1Title: "الحفظ والفهرسة التلقائية (ADMIN)",
      card1Prefix: "اترك خيار ",
      card1Strong: "الحفظ والفهرسة التلقائية",
      card1Suffix:
        " مفعلاً لتخزين القواعد وتوليد متجهات 1536-d فوراً في قاعدة البيانات.",
      card2Title: "وضع المعاينة الآمن (مستشار قانوني / قائد تقني)",
      card2Prefix:
        "أزل تحديد الحفظ التلقائي لمراجعة القواعد المستخرجة والنقر انتقائياً على ",
      card2Strong: "+ حفظ في Playbook",
      card2Suffix: ".",
    },
    telemetry: {
      heading: "الذاكرة الدلالية وقياسات FinOps للذكاء الاصطناعي (الميزة #7)",
      badge: "ذاكرة <1ms",
      introOpen: "افتح تبويب ",
      introStrong: "⚡ قياسات AI",
      introSuffix:
        " لمتابعة نسبة الإصابة وتوفير الرموز وزمن الاستجابة وتوفير التكلفة بالدولار لحظياً.",
      card1Title: "التحديث الذكي عبر بصمة SHA-256",
      card1Prefix: "تجمع مفاتيح SHA-256 بين المؤسسة",
      card1Suffix:
        " ونص البند والاستراتيجية وملخص السياسات والنموذج النشط — وأي تغيير يعيد التقييم فوراً.",
      card2Title: "تفريغ الذاكرة الدلالية",
      card2Prefix:
        "تُفرَّغ الذاكرة تلقائياً عند تغيير النموذج، أو يمكن للأدوار المصرح لها الضغط على ",
      card2Strong: "تفريغ الذاكرة الدلالية",
      card2Suffix: " يدوياً.",
    },
    footer: {
      openFullGuide: "فتح مركز المساعدة الكامل والقوالب",
      gotIt: "فهمت",
    },
  },
};

