import type { SupportedLocale } from "./translations";

export interface ProviderMetaCopy {
  tagline: string;
  badge: string;
}

export interface AISettingsModalCopy {
  title: string;
  hotSwapBadge: string;
  subtitle: string;
  loadingRuntime: string;
  presetsHeading: string;
  presetsHint: string;
  providers: Record<string, ProviderMetaCopy>;
  customProviderTagline: string;
  apiKeyShortBadge: string;
  localShortBadge: string;
  section1Title: string;
  section1Badge: string;
  activeLlmProviderLabel: string;
  modelIdLabel: string;
  manualIdBadge: string;
  fetchLiveModelsBtn: string;
  fetchingBtn: string;
  builtInEngineOption: string;
  pickLiveModelOption: string;
  livePrefix: string;
  modelInputPlaceholder: string;
  fetchedLlmModelsPrefix: string;
  fetchedLlmModelsMiddle: string;
  serverBaseUrlLabel: string;
  apiKeyLabel: string;
  noKeyRequiredBadge: string;
  keyConfiguredPrefix: string;
  apiKeyRequiredBadge: string;
  apiKeyOptionalPlaceholder: string;
  apiKeyStoredPrefix: string;
  apiKeyStoredSuffix: string;
  apiKeyPastePlaceholder: string;
  samplingTempLabel: string;
  deterministicSuffix: string;
  section2Title: string;
  section2Badge: string;
  activeEmbeddingProviderLabel: string;
  embeddingModelIdLabel: string;
  fetchedEmbModelsPrefix: string;
  fetchedEmbModelsMiddle: string;
  embeddingBaseUrlLabel: string;
  embeddingApiKeyLabel: string;
  storedPrefix: string;
  inheritsLlmKey: string;
  separateKeyRequired: string;
  embKeyReusePlaceholder: string;
  embKeyOptionalPlaceholder: string;
  pgvectorTitle: string;
  pgvectorDesc: string;
  missingModelPrefix: string;
  missingModelSuffix: string;
  vaultTitle: string;
  vaultSubtitlePrefix: string;
  vaultSubtitleSuffix: string;
  vaultPassphraseLabel: string;
  vaultMinChars: string;
  vaultPassphrasePlaceholder: string;
  exportVaultBtn: string;
  encryptingBtn: string;
  selectVaultFileBtn: string;
  unlockRestoreBtn: string;
  unlockingBtn: string;
  connVerifiedTitle: string;
  connFailedTitle: string;
  sampleAuditProbeLabel: string;
  testConnectionBtn: string;
  testingEngineBtn: string;
  cancelBtn: string;
  saveActivateBtn: string;
  activatingBtn: string;
  errMissingModel: string;
  errVaultPassphraseShort: string;
  errVaultMissingModel: string;
  msgVaultExported: string;
  errVaultExport: string;
  msgVaultLoadedPrefix: string;
  msgVaultLoadedSuffix: string;
  errInvalidVaultFile: string;
  errSelectVaultFirst: string;
  msgVaultUnlockedPrefix: string;
  msgVaultUnlockedSuffix: string;
  errVaultUnlock: string;
  msgActivatedPrefix: string;
  msgActivatedSuffix: string;
  errSaveConfig: string;
}

export const AI_SETTINGS_TRANSLATIONS: Record<
  SupportedLocale,
  AISettingsModalCopy
> = {
  en: {
    title: "AI Inference & Vector Engine Switcher",
    hotSwapBadge: "Zero-Restart Hot Swap",
    subtitle:
      "Configure Cloud LLMs, local Ollama/vLLM endpoints, and 1536-d Vector Embeddings in real time.",
    loadingRuntime: "Synchronizing active runtime AI configuration...",
    presetsHeading: "Quick-Select Provider Presets",
    presetsHint:
      "Select a provider, then enter Model ID or fetch live models",
    providers: {
      deterministic: {
        tagline:
          "Instant <5ms local policy evaluation • Zero external network calls",
        badge: "Zero API Key",
      },
      gemini: {
        tagline:
          "Native Google Generative Language REST API • Live /models discovery",
        badge: "Google AI",
      },
      groq: {
        tagline:
          "Ultra-low-latency LPU cloud inference • Live /models discovery",
        badge: "Ultra-Fast LPU",
      },
      openai: {
        tagline:
          "OpenAI Chat & Vector Embeddings API • Live /models discovery",
        badge: "OpenAI Cloud",
      },
      anthropic: {
        tagline:
          "Anthropic Messages API for legal reasoning • Live /models discovery",
        badge: "Legal Reasoning",
      },
      ollama: {
        tagline:
          "100% private local daemon (localhost:11434) • Live /api/tags discovery",
        badge: "100% Private Local",
      },
      openai_compatible: {
        tagline:
          "vLLM, LM Studio, llama.cpp or TEI HTTP endpoint • Live /v1/models discovery",
        badge: "Self-Hosted vLLM",
      },
    },
    customProviderTagline: "Custom Provider",
    apiKeyShortBadge: "API Key",
    localShortBadge: "Local",
    section1Title: "1. LLM Reasoning Engine",
    section1Badge: "Clause Auditor",
    activeLlmProviderLabel: "Active LLM Provider",
    modelIdLabel: "Model ID",
    manualIdBadge: "Manual ID",
    fetchLiveModelsBtn: "Fetch Live Models",
    fetchingBtn: "Fetching...",
    builtInEngineOption: "Built-in engine...",
    pickLiveModelOption: "Pick live model...",
    livePrefix: "Live:",
    modelInputPlaceholder: "Type model ID or click Fetch Live Models...",
    fetchedLlmModelsPrefix: "✓ Fetched",
    fetchedLlmModelsMiddle: "live LLM models from provider API",
    serverBaseUrlLabel: "Server Base URL",
    apiKeyLabel: "API Key",
    noKeyRequiredBadge: "No Key Required",
    keyConfiguredPrefix: "Key Configured:",
    apiKeyRequiredBadge: "API Key Required",
    apiKeyOptionalPlaceholder: "Optional bearer key (not required locally)",
    apiKeyStoredPrefix: "Stored (",
    apiKeyStoredSuffix: ") — enter to replace",
    apiKeyPastePlaceholder: "Paste provider API key (kept in memory)",
    samplingTempLabel: "Sampling Temperature",
    deterministicSuffix: "(0.00 = Deterministic)",
    section2Title: "2. Vector Embedding Engine",
    section2Badge: "1536-d Adapted",
    activeEmbeddingProviderLabel: "Active Embedding Provider",
    embeddingModelIdLabel: "Embedding Model ID",
    fetchedEmbModelsPrefix: "✓ Fetched",
    fetchedEmbModelsMiddle: "live Embedding models",
    embeddingBaseUrlLabel: "Embedding Server Base URL",
    embeddingApiKeyLabel: "Embedding API Key",
    storedPrefix: "Stored:",
    inheritsLlmKey: "Inherits LLM Key",
    separateKeyRequired: "Separate Key Required",
    embKeyReusePlaceholder: "Leave blank to reuse LLM API key",
    embKeyOptionalPlaceholder: "Optional separate embedding API key",
    pgvectorTitle: "1536-d pgvector Auto-Adaptation:",
    pgvectorDesc:
      "Any dimension (384–3072) is L2-normalized automatically with zero schema migrations.",
    missingModelPrefix:
      "Model ID required: Type an explicit model ID manually or click ",
    missingModelSuffix: " before activating.",
    vaultTitle: "Encrypted Configuration Vault",
    vaultSubtitlePrefix: "Export or reload encrypted ",
    vaultSubtitleSuffix: " keys offline",
    vaultPassphraseLabel: "Vault Passphrase",
    vaultMinChars: "Min 8 chars",
    vaultPassphrasePlaceholder: "Enter secret passphrase (min 8 chars)...",
    exportVaultBtn: "Export Vault (.rsvault)",
    encryptingBtn: "Encrypting...",
    selectVaultFileBtn: "Select .rsvault.json",
    unlockRestoreBtn: "Unlock & Restore",
    unlockingBtn: "Unlocking...",
    connVerifiedTitle: "Connection Verified — Engine Ready",
    connFailedTitle: "Connection Check Failed",
    sampleAuditProbeLabel: "Sample Audit Probe:",
    testConnectionBtn: "Test Connection",
    testingEngineBtn: "Testing Engine...",
    cancelBtn: "Cancel",
    saveActivateBtn: "Save & Activate Engine",
    activatingBtn: "Activating...",
    errMissingModel:
      "Model ID required: Type an explicit model ID manually or click Fetch Live Models to select one from the provider API.",
    errVaultPassphraseShort:
      "Vault passphrase must be at least 8 characters long.",
    errVaultMissingModel:
      "Model ID required: Enter explicit LLM and Embedding Model IDs before exporting an encrypted vault.",
    msgVaultExported:
      "Encrypted vault exported (redline-studio-ai-config.rsvault.json • AES-256-GCM + PBKDF2 600,000 iterations).",
    errVaultExport: "Failed to export encrypted AI configuration vault.",
    msgVaultLoadedPrefix: 'Loaded encrypted vault "',
    msgVaultLoadedSuffix: '". Enter passphrase and click Unlock & Restore Vault.',
    errInvalidVaultFile:
      "Invalid vault file: expected a valid AES-256-GCM .rsvault.json envelope.",
    errSelectVaultFirst:
      "Select an encrypted .rsvault.json file first before unlocking.",
    msgVaultUnlockedPrefix: "Vault unlocked & activated:",
    msgVaultUnlockedSuffix: "embeddings.",
    errVaultUnlock:
      "Failed to unlock AI configuration vault: invalid passphrase or corrupted vault file.",
    msgActivatedPrefix: "Activated",
    msgActivatedSuffix: "embeddings.",
    errSaveConfig: "Failed to save AI Engine configuration.",
  },
  es: {
    title: "Selector de Motor de Inferencia IA y Vectores",
    hotSwapBadge: "Cambio en Caliente",
    subtitle:
      "Configura LLMs en la nube, endpoints locales Ollama/vLLM y Embeddings vectoriales 1536-d en tiempo real.",
    loadingRuntime: "Sincronizando configuración IA activa...",
    presetsHeading: "Proveedores Preconfigurados",
    presetsHint:
      "Elige un proveedor e introduce un Model ID o descubre modelos en vivo",
    providers: {
      deterministic: {
        tagline:
          "Evaluación local <5ms • Cero llamadas de red externas",
        badge: "Sin API Key",
      },
      gemini: {
        tagline:
          "API REST nativa de Google Gemini • Descubrimiento /models en vivo",
        badge: "Google AI",
      },
      groq: {
        tagline:
          "Inferencia LPU de latencia ultrabaja • Descubrimiento /models en vivo",
        badge: "LPU Ultrarrápido",
      },
      openai: {
        tagline:
          "API de OpenAI Chat y Embeddings • Descubrimiento /models en vivo",
        badge: "OpenAI Cloud",
      },
      anthropic: {
        tagline:
          "API de Anthropic Claude para análisis legal • /models en vivo",
        badge: "Razonamiento Legal",
      },
      ollama: {
        tagline:
          "Servidor local 100% privado (localhost:11434) • /api/tags en vivo",
        badge: "100% Privado Local",
      },
      openai_compatible: {
        tagline:
          "Endpoint vLLM, LM Studio, llama.cpp o TEI • /v1/models en vivo",
        badge: "Autoalojado vLLM",
      },
    },
    customProviderTagline: "Proveedor Personalizado",
    apiKeyShortBadge: "API Key",
    localShortBadge: "Local",
    section1Title: "1. Motor de Razonamiento LLM",
    section1Badge: "Auditor de Cláusulas",
    activeLlmProviderLabel: "Proveedor LLM Activo",
    modelIdLabel: "ID de Modelo",
    manualIdBadge: "ID Manual",
    fetchLiveModelsBtn: "Obtener Modelos en Vivo",
    fetchingBtn: "Consultando...",
    builtInEngineOption: "Motor integrado...",
    pickLiveModelOption: "Elegir modelo en vivo...",
    livePrefix: "En vivo:",
    modelInputPlaceholder: "Escribe ID del modelo u obtén modelos en vivo...",
    fetchedLlmModelsPrefix: "✓ Obtenidos",
    fetchedLlmModelsMiddle: "modelos LLM en vivo de la API",
    serverBaseUrlLabel: "URL Base del Servidor",
    apiKeyLabel: "Clave API (API Key)",
    noKeyRequiredBadge: "No Requiere Clave",
    keyConfiguredPrefix: "Clave Configurada:",
    apiKeyRequiredBadge: "Clave API Requerida",
    apiKeyOptionalPlaceholder: "Clave opcional (no requerida localmente)",
    apiKeyStoredPrefix: "Guardada (",
    apiKeyStoredSuffix: ") — escribe para sustituir",
    apiKeyPastePlaceholder: "Pega tu clave API (solo en memoria)",
    samplingTempLabel: "Temperatura de Muestreo",
    deterministicSuffix: "(0.00 = Determinista)",
    section2Title: "2. Motor de Embeddings Vectoriales",
    section2Badge: "Adaptado a 1536-d",
    activeEmbeddingProviderLabel: "Proveedor de Embeddings Activo",
    embeddingModelIdLabel: "ID de Modelo Embedding",
    fetchedEmbModelsPrefix: "✓ Obtenidos",
    fetchedEmbModelsMiddle: "modelos de Embedding en vivo",
    embeddingBaseUrlLabel: "URL Base del Servidor de Embeddings",
    embeddingApiKeyLabel: "Clave API de Embeddings",
    storedPrefix: "Guardada:",
    inheritsLlmKey: "Hereda Clave LLM",
    separateKeyRequired: "Requiere Clave Propia",
    embKeyReusePlaceholder: "Dejar vacío para reutilizar la clave LLM",
    embKeyOptionalPlaceholder: "Clave API de embeddings opcional",
    pgvectorTitle: "Autoadaptación pgvector 1536-d:",
    pgvectorDesc:
      "Cualquier dimensión (384–3072) se normaliza en L2 automáticamente sin migraciones de esquema.",
    missingModelPrefix:
      "Se requiere ID de Modelo: Escribe un ID explícito o pulsa ",
    missingModelSuffix: " antes de activar.",
    vaultTitle: "Bóveda de Configuración Cifrada",
    vaultSubtitlePrefix: "Exporta o restaura claves cifradas ",
    vaultSubtitleSuffix: " sin conexión",
    vaultPassphraseLabel: "Contraseña de Bóveda",
    vaultMinChars: "Mín. 8 caract.",
    vaultPassphrasePlaceholder: "Contraseña secreta (mín. 8 caracteres)...",
    exportVaultBtn: "Exportar Bóveda (.rsvault)",
    encryptingBtn: "Cifrando...",
    selectVaultFileBtn: "Seleccionar .rsvault.json",
    unlockRestoreBtn: "Desbloquear y Restaurar",
    unlockingBtn: "Desbloqueando...",
    connVerifiedTitle: "Conexión Verificada — Motor Listo",
    connFailedTitle: "Error de Verificación",
    sampleAuditProbeLabel: "Prueba de Auditoría:",
    testConnectionBtn: "Probar Conexión",
    testingEngineBtn: "Probando Motor...",
    cancelBtn: "Cancelar",
    saveActivateBtn: "Guardar y Activar Motor",
    activatingBtn: "Activando...",
    errMissingModel:
      "Se requiere ID de Modelo: Escribe un Model ID manual o pulsa Obtener Modelos en Vivo.",
    errVaultPassphraseShort:
      "La contraseña de la bóveda debe tener al menos 8 caracteres.",
    errVaultMissingModel:
      "Se requiere ID de Modelo: Introduce IDs válidos de LLM y Embedding antes de exportar.",
    msgVaultExported:
      "Bóveda cifrada exportada (redline-studio-ai-config.rsvault.json • AES-256-GCM + PBKDF2 600,000 iteraciones).",
    errVaultExport: "Error al exportar la bóveda cifrada IA.",
    msgVaultLoadedPrefix: 'Bóveda cifrada cargada "',
    msgVaultLoadedSuffix: '". Introduce la contraseña y pulsa Desbloquear y Restaurar.',
    errInvalidVaultFile:
      "Archivo de bóveda inválido: se esperaba un sobre AES-256-GCM .rsvault.json válido.",
    errSelectVaultFirst:
      "Selecciona primero un archivo .rsvault.json antes de desbloquear.",
    msgVaultUnlockedPrefix: "Bóveda desbloqueada y activada:",
    msgVaultUnlockedSuffix: "embeddings.",
    errVaultUnlock:
      "Error al desbloquear bóveda IA: contraseña incorrecta o archivo corrupto.",
    msgActivatedPrefix: "Activado",
    msgActivatedSuffix: "embeddings.",
    errSaveConfig: "Error al guardar la configuración del motor IA.",
  },
  fr: {
    title: "Sélecteur de Moteur d'Inférence IA & Vecteurs",
    hotSwapBadge: "Changement à Chaud",
    subtitle:
      "Configurez des LLM Cloud, points locaux Ollama/vLLM et Embeddings vectoriels 1536-d en direct.",
    loadingRuntime: "Synchronisation de la configuration IA active...",
    presetsHeading: "Sélection Rapide de Fournisseurs",
    presetsHint:
      "Choisissez un fournisseur, saisissez le Model ID ou chargez les modèles en direct",
    providers: {
      deterministic: {
        tagline:
          "Évaluation locale <5 ms • Zéro appel réseau externe",
        badge: "Sans Clé API",
      },
      gemini: {
        tagline:
          "API REST Google Gemini • Découverte /models en direct",
        badge: "Google AI",
      },
      groq: {
        tagline:
          "Inférence LPU ultra-faible latence • Découverte /models en direct",
        badge: "LPU Ultra-Rapide",
      },
      openai: {
        tagline:
          "API OpenAI Chat & Embeddings • Découverte /models en direct",
        badge: "OpenAI Cloud",
      },
      anthropic: {
        tagline:
          "API Anthropic Claude juridique • Découverte /models en direct",
        badge: "Raisonnement Légal",
      },
      ollama: {
        tagline:
          "Démon local 100 % privé (localhost:11434) • Découverte /api/tags",
        badge: "100 % Local Privé",
      },
      openai_compatible: {
        tagline:
          "Point d'accès vLLM, LM Studio, llama.cpp ou TEI • /v1/models",
        badge: "Auto-Hébergé vLLM",
      },
    },
    customProviderTagline: "Fournisseur Personnalisé",
    apiKeyShortBadge: "Clé API",
    localShortBadge: "Local",
    section1Title: "1. Moteur de Raisonnement LLM",
    section1Badge: "Auditeur de Clauses",
    activeLlmProviderLabel: "Fournisseur LLM Actif",
    modelIdLabel: "ID du Modèle",
    manualIdBadge: "ID Manuel",
    fetchLiveModelsBtn: "Modèles en Direct",
    fetchingBtn: "Chargement...",
    builtInEngineOption: "Moteur intégré...",
    pickLiveModelOption: "Choisir un modèle...",
    livePrefix: "En direct :",
    modelInputPlaceholder: "Saisissez un ID ou cliquez sur Modèles en Direct...",
    fetchedLlmModelsPrefix: "✓ Récupérés",
    fetchedLlmModelsMiddle: "modèles LLM depuis l'API",
    serverBaseUrlLabel: "URL de Base du Serveur",
    apiKeyLabel: "Clé API",
    noKeyRequiredBadge: "Aucune Clé Requise",
    keyConfiguredPrefix: "Clé Configurée :",
    apiKeyRequiredBadge: "Clé API Requise",
    apiKeyOptionalPlaceholder: "Jeton optionnel (non requis en local)",
    apiKeyStoredPrefix: "Stockée (",
    apiKeyStoredSuffix: ") — saisir pour remplacer",
    apiKeyPastePlaceholder: "Collez votre clé API (conservée en mémoire)",
    samplingTempLabel: "Température d'Échantillonnage",
    deterministicSuffix: "(0.00 = Déterministe)",
    section2Title: "2. Moteur d'Embeddings Vectoriels",
    section2Badge: "Adapté 1536-d",
    activeEmbeddingProviderLabel: "Fournisseur Embeddings Actif",
    embeddingModelIdLabel: "ID du Modèle Embedding",
    fetchedEmbModelsPrefix: "✓ Récupérés",
    fetchedEmbModelsMiddle: "modèles Embedding en direct",
    embeddingBaseUrlLabel: "URL du Serveur Embedding",
    embeddingApiKeyLabel: "Clé API Embedding",
    storedPrefix: "Stockée :",
    inheritsLlmKey: "Hérite de la Clé LLM",
    separateKeyRequired: "Clé Dédiée Requise",
    embKeyReusePlaceholder: "Laisser vide pour réutiliser la clé LLM",
    embKeyOptionalPlaceholder: "Clé API Embedding distincte (optionnelle)",
    pgvectorTitle: "Adaptation Automatique pgvector 1536-d :",
    pgvectorDesc:
      "Toute dimension (384–3072) est normalisée en L2 sans aucune migration de schéma.",
    missingModelPrefix:
      "ID de Modèle requis : saisissez un Model ID manuel ou cliquez sur ",
    missingModelSuffix: " avant d'activer.",
    vaultTitle: "Coffre de Configuration Chiffré",
    vaultSubtitlePrefix: "Exportez ou rechargez vos clés ",
    vaultSubtitleSuffix: " hors-ligne",
    vaultPassphraseLabel: "Mot de Passe du Coffre",
    vaultMinChars: "Min. 8 car.",
    vaultPassphrasePlaceholder: "Saisissez un mot de passe (min. 8 car.)...",
    exportVaultBtn: "Exporter Coffre (.rsvault)",
    encryptingBtn: "Chiffrement...",
    selectVaultFileBtn: "Choisir .rsvault.json",
    unlockRestoreBtn: "Déverrouiller & Restaurer",
    unlockingBtn: "Déverrouillage...",
    connVerifiedTitle: "Connexion Vérifiée — Moteur Prêt",
    connFailedTitle: "Échec du Test de Connexion",
    sampleAuditProbeLabel: "Sonde d'Audit Test :",
    testConnectionBtn: "Tester la Connexion",
    testingEngineBtn: "Test en cours...",
    cancelBtn: "Annuler",
    saveActivateBtn: "Enregistrer & Activer",
    activatingBtn: "Activation...",
    errMissingModel:
      "ID de Modèle requis : saisissez un Model ID manuel ou cliquez sur Modèles en Direct.",
    errVaultPassphraseShort:
      "Le mot de passe du coffre doit comporter au moins 8 caractères.",
    errVaultMissingModel:
      "ID de Modèle requis : renseignez les Model ID LLM et Embedding avant d'exporter.",
    msgVaultExported:
      "Coffre chiffré exporté (redline-studio-ai-config.rsvault.json • AES-256-GCM + PBKDF2 600 000 itérations).",
    errVaultExport: "Impossible d'exporter le coffre chiffré IA.",
    msgVaultLoadedPrefix: 'Coffre chiffré chargé « ',
    msgVaultLoadedSuffix:
      ' ». Saisissez le mot de passe puis cliquez sur Déverrouiller & Restaurer.',
    errInvalidVaultFile:
      "Fichier invalide : enveloppe AES-256-GCM .rsvault.json valide attendue.",
    errSelectVaultFirst:
      "Sélectionnez d'abord un fichier .rsvault.json avant de déverrouiller.",
    msgVaultUnlockedPrefix: "Coffre déverrouillé et activé :",
    msgVaultUnlockedSuffix: "embeddings.",
    errVaultUnlock:
      "Échec du déverrouillage : mot de passe incorrect ou fichier corrompu.",
    msgActivatedPrefix: "Activé :",
    msgActivatedSuffix: "embeddings.",
    errSaveConfig: "Échec de l'enregistrement de la configuration du moteur IA.",
  },
  ar: {
    title: "إعدادات ومبدّل محركات الذكاء الاصطناعي والمتجهات",
    hotSwapBadge: "تبديل فوري دون إعادة تشغيل",
    subtitle:
      "اضبط نماذج اللغة السحابية، وخوادم Ollama/vLLM المحلية، ومحركات التضمين 1536-d في الوقت الفعلي.",
    loadingRuntime: "جارٍ مزامنة إعدادات الذكاء الاصطناعي النشطة...",
    presetsHeading: "إعدادات المزودين الجاهزة",
    presetsHint:
      "اختر مزوداً، ثم أدخل معرّف النموذج أو اجلب النماذج الحية مباشرة",
    providers: {
      deterministic: {
        tagline:
          "تقييم محلي فوري <5ms وفق السياسات • صفر اتصالات شبكية خارجية",
        badge: "دون مفتاح API",
      },
      gemini: {
        tagline:
          "واجهة Google Generative Language REST الأصلية • جلب مباشر عبر /models",
        badge: "Google AI",
      },
      groq: {
        tagline:
          "استدلال LPU فائق السرعة وانخفاض الكمون • جلب مباشر عبر /models",
        badge: "LPU فائق السرعة",
      },
      openai: {
        tagline:
          "واجهة OpenAI Chat و Vector Embeddings • جلب مباشر عبر /models",
        badge: "OpenAI Cloud",
      },
      anthropic: {
        tagline:
          "واجهة Anthropic Messages للتحليل القانوني المتقدم • جلب /models",
        badge: "تحليل قانوني",
      },
      ollama: {
        tagline:
          "خادم محلي خاص 100% (localhost:11434) • جلب مباشر عبر /api/tags",
        badge: "محلي وخاص 100%",
      },
      openai_compatible: {
        tagline:
          "نقطة نهاية vLLM أو LM Studio أو llama.cpp أو TEI • جلب /v1/models",
        badge: "استضافة ذاتية vLLM",
      },
    },
    customProviderTagline: "مزود مخصص",
    apiKeyShortBadge: "مفتاح API",
    localShortBadge: "محلي",
    section1Title: "1. محرك الاستدلال اللغوي (LLM)",
    section1Badge: "مدقق البنود",
    activeLlmProviderLabel: "مزود LLM النشط",
    modelIdLabel: "معرّف النموذج (Model ID)",
    manualIdBadge: "إدخال يدوي",
    fetchLiveModelsBtn: "جلب النماذج الحية",
    fetchingBtn: "جارٍ الجلب...",
    builtInEngineOption: "المحرك المدمج...",
    pickLiveModelOption: "اختر نموذجاً حياً...",
    livePrefix: "مباشر:",
    modelInputPlaceholder: "اكتب Model ID أو اضغط جلب النماذج الحية...",
    fetchedLlmModelsPrefix: "✓ تم جلب",
    fetchedLlmModelsMiddle: "نموذج LLM حي من واجهة المزود",
    serverBaseUrlLabel: "عنوان الخادم (Base URL)",
    apiKeyLabel: "مفتاح API",
    noKeyRequiredBadge: "لا يتطلب مفتاحاً",
    keyConfiguredPrefix: "مفتاح محفوظ:",
    apiKeyRequiredBadge: "مفتاح API مطلوب",
    apiKeyOptionalPlaceholder: "مفتاح اختياري (غير مطلوب محلياً)",
    apiKeyStoredPrefix: "محفوظ (",
    apiKeyStoredSuffix: ") — اكتب للاستبدال",
    apiKeyPastePlaceholder: "الصق مفتاح API الخاص بالمزود (يُحفظ في الذاكرة فقط)",
    samplingTempLabel: "درجة الحرارة (Sampling Temperature)",
    deterministicSuffix: "(0.00 = حتمي دقيق)",
    section2Title: "2. محرك التضمين المتجهي (Embeddings)",
    section2Badge: "متوافق 1536-d",
    activeEmbeddingProviderLabel: "مزود التضمين النشط",
    embeddingModelIdLabel: "معرّف نموذج التضمين",
    fetchedEmbModelsPrefix: "✓ تم جلب",
    fetchedEmbModelsMiddle: "نموذج Embedding حي",
    embeddingBaseUrlLabel: "عنوان خادم التضمين",
    embeddingApiKeyLabel: "مفتاح API للتضمين",
    storedPrefix: "محفوظ:",
    inheritsLlmKey: "يرث مفتاح LLM",
    separateKeyRequired: "يتطلب مفتاحاً مستقلاً",
    embKeyReusePlaceholder: "اتركه فارغاً لإعادة استخدام مفتاح LLM أعلاه",
    embKeyOptionalPlaceholder: "مفتاح API اختياري لمزود التضمين",
    pgvectorTitle: "التكيّف التلقائي لـ pgvector 1536-d:",
    pgvectorDesc:
      "يتم توحيد أي بُعد متجهي (384–3072) تلقائياً بمعيار L2 دون تعديل مخطط قاعدة البيانات.",
    missingModelPrefix: "معرّف النموذج مطلوب: اكتب Model ID يدوياً أو اضغط ",
    missingModelSuffix: " قبل التفعيل.",
    vaultTitle: "خزنة الإعدادات المشفرة",
    vaultSubtitlePrefix: "تصدير أو استعادة مفاتيحك المشفرة بصيغة ",
    vaultSubtitleSuffix: " دون اتصال",
    vaultPassphraseLabel: "عبارة مرور الخزنة",
    vaultMinChars: "8 أحرف على الأقل",
    vaultPassphrasePlaceholder: "أدخل عبارة مرور سرية (8 أحرف فأكثر)...",
    exportVaultBtn: "تصدير الخزنة (.rsvault)",
    encryptingBtn: "جارٍ التشفير...",
    selectVaultFileBtn: "اختيار ملف .rsvault.json",
    unlockRestoreBtn: "فك القفل والاستعادة",
    unlockingBtn: "جارٍ فك القفل...",
    connVerifiedTitle: "تم التحقق من الاتصال — المحرك جاهز",
    connFailedTitle: "فشل فحص الاتصال",
    sampleAuditProbeLabel: "فحص تدقيق تجريبي:",
    testConnectionBtn: "اختبار الاتصال",
    testingEngineBtn: "جارٍ فحص المحرك...",
    cancelBtn: "إلغاء",
    saveActivateBtn: "حفظ وتفعيل",
    activatingBtn: "جارٍ التفعيل...",
    errMissingModel:
      "معرّف النموذج مطلوب: أدخل Model ID يدوياً أو اختر نموذجاً حياً.",
    errVaultPassphraseShort:
      "أدخل عبارة مرور للخزنة مكوّنة من 8 أحرف على الأقل.",
    errVaultMissingModel:
      "معرّف النموذج مطلوب: حدد Model ID لمحرك LLM والتضمين قبل تصدير الخزنة.",
    msgVaultExported:
      "تم تصدير الخزنة المشفرة (redline-studio-ai-config.rsvault.json • AES-256-GCM + PBKDF2 600k تكرار).",
    errVaultExport: "تعذّر تصدير خزنة إعدادات الذكاء الاصطناعي المشفرة.",
    msgVaultLoadedPrefix: 'تم تحميل ملف الخزنة المشفر "',
    msgVaultLoadedSuffix:
      '". أدخل عبارة المرور السرية واضغط «فك القفل والاستعادة».',
    errInvalidVaultFile:
      "ملف خزنة غير صالح: يجب اختيار ملف AES-256-GCM بصيغة .rsvault.json صالحة.",
    errSelectVaultFirst:
      "يرجى اختيار ملف .rsvault.json أولاً قبل الضغط على فك القفل.",
    msgVaultUnlockedPrefix: "تم فتح الخزنة وتفعيل المحرك:",
    msgVaultUnlockedSuffix: "تضمين متجهي.",
    errVaultUnlock:
      "فشل فك قفل الخزنة: عبارة المرور غير صحيحة أو الملف تالف.",
    msgActivatedPrefix: "تم التفعيل:",
    msgActivatedSuffix: "تضمين متجهي.",
    errSaveConfig: "تعذّر حفظ إعدادات محرك الذكاء الاصطناعي.",
  },
};

