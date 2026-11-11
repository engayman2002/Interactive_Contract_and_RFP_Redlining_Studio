import type {
  ExportComparisonItem,
  HeatmapLegendItem,
  HelpFaqItem,
  HelpGuideModule,
  PlaybookRuleTemplate,
} from "@/services/helpContent";

export interface LocalizedHeatmapLegendItem extends HeatmapLegendItem {
  localizedLevel: string;
}

export interface LocalizedHelpCatalog {
  modules: HelpGuideModule[];
  templates: PlaybookRuleTemplate[];
  heatmapLegend: LocalizedHeatmapLegendItem[];
  exportComparison: ExportComparisonItem[];
  faqs: HelpFaqItem[];
}

export const HELP_CATALOG_TRANSLATIONS: Record<
  "es" | "fr" | "ar",
  LocalizedHelpCatalog
> = {
  es: {
    modules: [
      {
        id: "quick-start",
        number: 1,
        title: "Inicio Rápido: El Flujo de Revisión Contractual en 4 Pasos",
        badge: "Primeros Pasos",
        summary:
          "Pasa de un contrato o RFP de terceros en bruto a un documento de Microsoft Word completamente redactado y conforme a políticas en cuatro pasos estructurados.",
        keywords: [
          "inicio rapido",
          "flujo",
          "4 pasos",
          "subir",
          "analizar",
          "playbook",
          "exportar",
        ],
        steps: [
          {
            title: "Paso 1: Define o Revisa el Playbook Corporativo (/playbooks)",
            description:
              "Antes de auditar un contrato, verifica los estándares de negociación de tu empresa en el Gestor de Playbooks. Cada regla almacena tu Posición Estándar, Posición Alternativa y Frases Bloquentes.",
            tip: "De fábrica, tu espacio incluye 5 políticas legales empresariales precargadas (Limitación de Responsabilidad, Indemnización, SLA, Privacidad de Datos y Ley Aplicable).",
          },
          {
            title: "Paso 2: Sube tu Contrato o RFP en el Panel Principal (/)",
            description:
              "Arrastra y suelta cualquier acuerdo .docx o .pdf (hasta 25 MB) en la zona de carga del Panel. El analizador estructural extrae cada cláusula conservando la numeración legal (ej. 1.1, Artículo IV).",
          },
          {
            title: "Paso 3: Haz clic en 'Analizar Contrato' dentro del Estudio",
            description:
              "En el Estudio de Redacción Dual, pulsa 'Analizar Contrato'. El buscador híbrido vectorial + léxico empareja cada cláusula con tu Playbook y transmite sugerencias en tiempo real mediante Server-Sent Events (SSE).",
          },
          {
            title: "Paso 4: Previsualiza Diferencias, Resuelve y Exporta a Word (.docx)",
            description:
              "Pasa el cursor sobre 'Aplicar Cambio' para previsualizar eliminaciones e inserciones palabra por palabra dentro del contrato. Acepta, Modifica o Rechaza cada sugerencia, colabora con comentarios y exporta a Word con Control de Cambios o Copia Limpia.",
          },
        ],
      },
      {
        id: "uploading-contracts",
        number: 2,
        title: "Carga de Contratos y RFPs (.docx y .pdf)",
        badge: "Ingesta y Análisis",
        summary:
          "Descubre cómo el pipeline de ingesta estructural conserva la numeración jerárquica, agrupa subcláusulas dependientes y protege los archivos cargados.",
        keywords: [
          "subir",
          "docx",
          "pdf",
          "analizador",
          "clausula",
          "numeracion",
          "ingesta",
          "25mb",
        ],
        steps: [
          {
            title: "Preservación de la Numeración y Jerarquía Legal",
            description:
              "El segmentador de cláusulas reconoce patrones jerárquicos (1., 1.1, 1.1.1, Artículo I, Sección 2) y vincula automáticamente subcláusulas dependientes ((a), (b), (i), (ii)) a su disposición principal sin fragmentar el contexto.",
          },
          {
            title: "Limpieza Automática de Encabezados y Seguridad OpenXML",
            description:
              "En documentos PDF se eliminan automáticamente encabezados repetidos, pies de página y numeración Bates. En archivos Word (.docx), se validan firmas binarias y se bloquean ataques Zip-Slip y XXE.",
          },
          {
            title: "Carga Rápida dentro del Estudio (+ Subir)",
            description:
              "¿Trabajas en el Estudio y recibiste una nueva versión de la contraparte? Haz clic en 'Subir' en la barra superior del Estudio para ingerir y abrir el nuevo contrato sin volver al Panel.",
          },
        ],
      },
      {
        id: "writing-playbook-rules",
        number: 3,
        title: "Redacción de Reglas de Alto Impacto en el Playbook (/playbooks)",
        badge: "Ingeniería de Playbook",
        summary:
          "Configura estándares corporativos precisos para que el motor híbrido Vectorial + BM25 recupere la política exacta para cada cláusula.",
        keywords: [
          "playbook",
          "reglas",
          "posicion estandar",
          "posicion alternativa",
          "vector",
          "bm25",
          "politica",
        ],
        steps: [
          {
            title: "Cómo Funciona la Recuperación Híbrida Vectorial + Léxica",
            description:
              "Al evaluar una cláusula, el motor combina similitud semántica vectorial de 1536 dimensiones (70% peso) con coincidencia léxica BM25 (30% peso) para elegir las 3 reglas rectoras en menos de 150ms.",
          },
          {
            title: "Categoría y Posición Estándar (Requisito Base)",
            description:
              "Usa categorías jurídicas claras (p. ej., Limitación de Responsabilidad, Indemnización, Privacidad e IA, Propiedad Intelectual) y redacta la Posición Estándar como texto contractual firme.",
          },
          {
            title: "Posición Alternativa (Límite Preaprobado de Concesión)",
            description:
              "Especifica la redacción intermedia autorizada cuando la contraparte rechaza tu posición estándar (p. ej., un superlímite de 2x el valor anual del contrato frente a un tope de 12 meses).",
          },
          {
            title: "Frases Bloquentes (Disparadores de Alerta Roja)",
            description:
              "Enumera expresiones separadas por comas que deben activar de inmediato riesgo CRÍTICO o ALTO, como 'responsabilidad ilimitada', 'exclusiva discreción', 'daños consecuentes' o 'entrenar modelos públicos'.",
          },
        ],
      },
      {
        id: "mastering-studio",
        number: 4,
        title: "Dominar el Estudio de Redacción Dual (/documents/[id])",
        badge: "Espacio Interactivo",
        summary:
          "Navega cláusulas a 60 FPS con sincronización bidireccional, pines de riesgo en el Mapa de Calor, comparativos en línea y resolución en un clic.",
        keywords: [
          "estudio",
          "pantalla dividida",
          "mapa de calor",
          "diff",
          "aplicar cambio",
          "modificar",
          "rechazar",
          "argumento",
        ],
        steps: [
          {
            title: "Sincronización Bidireccional Editor ↔ Inspector",
            description:
              "Al hacer clic en cualquier cláusula en el contrato izquierdo se resalta y desplaza automáticamente su Tarjeta de Riesgo IA en el inspector derecho en 16ms, y viceversa.",
          },
          {
            title: "Previsualización de Diferencias Palabra por Palabra al Pasar el Cursor",
            description:
              "Sitúa el ratón sobre el botón 'Aplicar Cambio' en cualquier tarjeta IA. El lienzo izquierdo muestra al instante palabras eliminadas tachadas en rojo e inserciones del Playbook resaltadas en verde.",
          },
          {
            title: "Resolución en Un Clic: Aplicar Cambio, Modificar o Rechazar",
            description:
              "Pulsa 'Aplicar Cambio' para aceptar la reescritura IA de inmediato, 'Modificar' para editar manualmente el texto propuesto antes de guardar, o 'Rechazar' para mantener el texto original.",
          },
          {
            title: "Argumentos de Negociación para el Asesor Externo",
            description:
              "Cada tarjeta incluye tanto una Justificación de Política interna como un Argumento de Negociación listo para copiar y enviar por correo a la contraparte.",
          },
        ],
      },
      {
        id: "collaboration-concurrency-audit",
        number: 5,
        title: "Colaboración, Protección de Versiones y Registro de Auditoría",
        badge: "Gobernanza y Concurrencia",
        summary:
          "Colabora entre Legal, Compras y Liderazgo Técnico con hilos de discusión por cláusula, bloqueo optimista y registro inmutable.",
        keywords: [
          "colaboracion",
          "comentarios",
          "version",
          "concurrencia",
          "conflicto 409",
          "auditoria",
          "rbac",
          "roles",
        ],
        steps: [
          {
            title: "Hilos de Discusión Plegables por Cláusula",
            description:
              "Cada cláusula tiene un cajón de discusión en la parte inferior del Inspector IA. Los miembros del equipo pueden publicar notas legales vinculadas directamente a esa disposición.",
          },
          {
            title: "Control de Concurrencia Optimista (v1 → v2)",
            description:
              "Cada cláusula muestra su versión activa (v1, v2, v3). Al aceptar o modificar, el estudio envía expected_clause_version; si otro revisor editó la misma cláusula milisegundos antes, el servidor devuelve 409 Conflict y revierte el cambio obsoleto.",
          },
          {
            title: "Registro Inmutable de Auditoría y Cumplimiento",
            description:
              "Cambia a la pestaña 'Auditoría' en el inspector para ver el historial cronológico inviolable de cada ingesta, análisis IA, resolución, comentario y exportación a Word.",
          },
        ],
      },
      {
        id: "exporting-word-docx",
        number: 6,
        title: "Exportación a Microsoft Word (Control de Cambios vs. Copia Limpia .docx)",
        badge: "Exportación OpenXML",
        summary:
          "Genera archivos .docx compatibles con OpenXML con marcas reales de Control de Cambios (<w:ins> y <w:del>) o copias limpias listas para firma.",
        keywords: [
          "exportar",
          "word",
          "docx",
          "control de cambios",
          "copia limpia",
          "openxml",
          "libreoffice",
        ],
        steps: [
          {
            title: "Exportar Control Cambios (.docx) para Negociación",
            description:
              "Genera un documento Microsoft Word nativo con etiquetas <w:del> (tachado) y <w:ins> (subrayado), autor, fecha ISO, justificaciones IA y comentarios al margen. Ábrelo en Word o LibreOffice Writer.",
          },
          {
            title: "Exportar Copia Limpia (.docx) para Firma Final",
            description:
              "Genera una versión pulida donde todas las cláusulas ACEPTADAS y MODIFICADAS quedan fusionadas sin marcas de revisión ni comentarios internos.",
          },
        ],
      },
      {
        id: "ai-engine-switcher",
        number: 7,
        title: "Selector Dinámico de Proveedor y Modelo IA (Cloud y Local)",
        badge: "Cambio en Caliente",
        summary:
          "Configura, prueba la conectividad y cambia al instante proveedores LLM y de Embeddings 1536-d sin reiniciar contenedores.",
        keywords: [
          "ajustes ia",
          "proveedor",
          "gemini",
          "groq",
          "openai",
          "anthropic",
          "ollama",
          "vllm",
          "boveda",
          "rsvault",
        ],
        steps: [
          {
            title: "Abre el Selector de Motor IA desde la Cabecera",
            description:
              "Haz clic en el distintivo 'IA: ...' en la barra de navegación o del Estudio para inspeccionar los motores LLM y Vectorial activos.",
          },
          {
            title: "Descubrimiento en Vivo (/models) o ID Manual",
            description:
              "Elige Motor Determinista Local, Google Gemini, Groq LPU, OpenAI, Anthropic Claude, Ollama local (localhost:11434) o vLLM/LM Studio. Pulsa 'Obtener Modelos en Vivo' para consultar la API del proveedor o escribe cualquier Model ID explícitamente.",
          },
          {
            title: "Ejecuta Diagnóstico de Conexión antes de Guardar",
            description:
              "Haz clic en 'Probar Conexión' para validar adaptación vectorial a 1536-d, respuesta estructurada y latencia en milisegundos antes de pulsar 'Guardar y Activar Motor'.",
          },
          {
            title: "Respalda Claves mediante la Bóveda Cifrada (.rsvault.json)",
            description:
              "Las claves nunca se guardan en texto plano en disco. Introduce una contraseña (mín. 8 caracteres) y exporta un archivo .rsvault.json cifrado localmente con AES-256-GCM + PBKDF2 (600,000 iteraciones) para restaurarlo en un clic en futuras sesiones.",
          },
        ],
      },
      {
        id: "negotiation-stance-selector",
        number: 8,
        title: "Selector de Postura de Negociación IA (Estricto vs. Equilibrado vs. Comercial)",
        badge: "Postura de Negociación",
        summary:
          "Adapta dinámicamente el rigor de las sugerencias IA al contexto de cada operación: Estricto, Equilibrado o Comercial Ágil.",
        keywords: [
          "postura",
          "estricto",
          "equilibrado",
          "comercial",
          "cierre rapido",
          "alternativa",
        ],
        steps: [
          {
            title: "Postura Estricta: Gobernanza Jurídica sin Concesiones",
            description:
              "Exige la posición estándar corporativa en todas las cláusulas. Cualquier desviación pasa a CRÍTICO/ALTO con etiqueta [Postura Estricta Protectora] y argumentos firmes no negociables.",
            tip: "Ideal cuando tu empresa tiene alto poder negociador o el contrato implica infraestructura crítica o propiedad intelectual clave.",
          },
          {
            title: "Postura Equilibrada: Estándares Bilaterales Recíprocos (Predeterminada)",
            description:
              "Convierte obligaciones unilaterales en compromisos recíprocos ('Cada parte...') defendiendo los límites esenciales con etiqueta [Postura Mutua Equilibrada].",
            tip: "Recomendada para el 80% de los acuerdos comerciales rutinarios con proveedores y clientes.",
          },
          {
            title: "Postura Comercial: Máxima Velocidad de Cierre",
            description:
              "Adopta automáticamente las posiciones alternativas preaprobadas de tu Playbook (p. ej., límite de 2x honorarios anuales) para evitar idas y vueltas innecesarias, bajo la etiqueta [Postura Comercial Ágil].",
            tip: "Perfecta para cierres de trimestre, contratos de bajo monto o renovaciones SaaS de bajo riesgo.",
          },
          {
            title: "Cambio de Postura en la Cabecera del Estudio",
            description:
              "Alterna entre Estricto, Equilibrado y Comercial antes de pulsar 'Analizar Contrato'. Puedes reauditar cuando quieras para comparar el texto propuesto según postura.",
          },
        ],
      },
      {
        id: "inline-clause-ai-copilot",
        number: 9,
        title: "Copiloto IA por Cláusula e Instrucciones Personalizadas",
        badge: "Copiloto IA",
        summary:
          "Dirige al motor IA en cláusulas individuales usando instrucciones en lenguaje natural o chips rápidos para ajustar topes, plazos de subsanación y tono.",
        keywords: [
          "copiloto",
          "instruccion",
          "tope responsabilidad",
          "plazo subsanacion",
          "mutuo",
          "suavizar tono",
          "refinar",
        ],
        steps: [
          {
            title: "Abre el Cajón de Copiloto IA en la Tarjeta",
            description:
              "Haz clic en '✨ Copiloto IA' en cualquier tarjeta de redline para desplegar chips predefinidos y el campo de instrucción personalizada.",
            tip: "Funciona tanto en modo determinista local como conectado a Gemini, Groq, OpenAI, Anthropic u Ollama.",
          },
          {
            title: "Chips de Directiva Rápida en Un Clic",
            description:
              "Usa accesos directos: 'Hacer Estrictamente Mutuo', 'Limitar Responsabilidad a $100,000', 'Añadir Plazo de Subsanación de 30 Días' o 'Suavizar Tono para Socio'.",
          },
          {
            title: "Prompts Libres en Lenguaje Natural",
            description:
              "Escribe cualquier directiva (p. ej., 'Limitar responsabilidad agregada a $250,000 y exigir informe SOC 2 en 14 días') y pulsa 'Refinar con IA'.",
            tip: "Actualiza al instante el texto propuesto, añade la etiqueta [Copiloto IA Refinado: \"...\"] y genera un nuevo argumento ejecutivo.",
          },
          {
            title: "Trazabilidad Inmutable en Auditoría",
            description:
              "Cada refinamiento registra un evento SUGGESTION_REFINED inmutable con la instrucción exacta, usuario y marca temporal.",
          },
        ],
      },
      {
        id: "cross-clause-radar",
        number: 10,
        title: "Radar de Integridad, Contradicciones y Referencias Cruzadas",
        badge: "Integridad Documental",
        summary:
          "Detecta contradicciones lógicas entre cláusulas, citas rotas a secciones inexistentes y términos en mayúsculas sin definir con un Índice de Integridad 0–100%.",
        keywords: [
          "radar",
          "contradiccion",
          "referencia rota",
          "termino sin definir",
          "indice de integridad",
        ],
        steps: [
          {
            title: "Límites de la Revisión Aislada Párrafo por Párrafo",
            description:
              "Muchas fallas graves solo emergen al comparar cláusulas distantes: p. ej. Cláusula #1 limita responsabilidad a $500 mientras Cláusula #8 impone indemnidad ilimitada, o plazos Net 30 frente a Net 15.",
            tip: "El Radar analiza el grafo completo de cláusulas para detectar inconsistencias globales.",
          },
          {
            title: "Las 3 Categorías de Hallazgos Estructurales",
            description:
              "Clasifica automáticamente en: 1) CONTRADICTION (obligaciones, topes o plazos incompatibles), 2) BROKEN_REFERENCE (citas a secciones inexistentes como 'Sección 99.4') y 3) UNDEFINED_TERM (términos operativos sin definición formal).",
          },
          {
            title: "Índice de Integridad Documental (0–100%)",
            description:
              "Parte de 100% y descuenta penalizaciones ponderadas según gravedad (Crítico -18 pts, Alto -12 pts, Medio -6 pts, Bajo -3 pts, mínimo 15%). Al armonizar las cláusulas, el índice sube hacia 100%.",
          },
          {
            title: "Salto Bilateral con Un Clic entre Cláusulas en Conflicto",
            description:
              "Cada hallazgo ofrece botones interactivos 'Origen: Cláusula #X' y 'Conflicto con: Cláusula #Y' para desplazarte inmediatamente a cualquiera de las dos disposiciones en el editor.",
          },
          {
            title: "Registro de Cumplimiento SOC 2",
            description:
              "Cada escaneo registra un evento CROSS_CLAUSE_CHECKED con el total de hallazgos y la puntuación obtenida.",
          },
        ],
      },
      {
        id: "critic-verifier-guard",
        number: 11,
        title: "Bucle Multiagente Crítico-Refinador y Guardia Anti-Alucinaciones",
        badge: "Verificación Multiagente",
        summary:
          "Toda sugerencia generada o refinada pasa por dos agentes: Agente 1 (Redactor) → Agente 2 (Guardián Crítico), que audita política, marcadores ficticios y numeración legal.",
        keywords: [
          "critic guard",
          "guardian critico",
          "alucinaciones",
          "verificado",
          "auto-refinado",
          "confianza",
        ],
        steps: [
          {
            title: "Pipeline Dual: Redactor → Verificador Crítico",
            description:
              "Tanto en auditorías completas como en refinamientos de Copiloto, el Agente 2 valida la salida del Agente 1 y repara defectos automáticamente antes de mostrarla.",
            tip: "Elimina errores típicos de un solo pase como prefijos numéricos omitidos o frases prohibidas heredadas.",
          },
          {
            title: "Los 3 Controles Obligatorios de Seguridad",
            description:
              "1) Basado en Política: elimina disparadores prohibidos; 2) Sin Alucinaciones: limpia marcadores [TBD] o [INSERTAR]; 3) Numeración y Obligaciones Preservadas: conserva prefijos (1.1, 2.1) para alineación OpenXML.",
          },
          {
            title: "Distintivos: Verificado vs. Auto-Refinado vs. Revisión Requerida",
            description:
              "'🛡️ Verificado' (verde, 85–99%) superó los 3 controles; '✨ Auto-Refinado' (azul) indica corrección automática por el Agente 2; '⚠️ Revisión Requerida' (ámbar, <75%) señala baja cobertura en el Playbook.",
          },
          {
            title: "Botón 'Reverificar con Crítico'",
            description:
              "Tras editar manualmente un texto, pulsa 'Reverificar con Crítico' para ejecutar los 3 controles bajo demanda y registrar SUGGESTION_VERIFIED en auditoría.",
          },
        ],
      },
      {
        id: "counterparty-pushback-simulator",
        number: 12,
        title: "Simulador de Objeciones de Contraparte y Motor de Réplica Ronda 2",
        badge: "Preparación Adversarial",
        summary:
          "Anticipa cómo reaccionará el abogado contrario antes de enviar tus cambios: Probabilidad de Aceptación (0–100%), Severidad, objeción esperada, réplica copiable y compromiso Ronda 2.",
        keywords: [
          "objecion",
          "simular objecion",
          "contraparte",
          "replica",
          "compromiso",
          "ronda 2",
          "dealbreaker",
        ],
        steps: [
          {
            title: "Lanzar la Simulación Adversarial",
            description:
              "Haz clic en '🎯 Simular Objeción' en cualquier tarjeta. El agente compara el texto original, tu propuesta, las reglas del Playbook y la postura activa.",
            tip: "Simular con postura Estricta muestra puntos de fricción reales; bajo postura Comercial eleva la probabilidad de aceptación.",
          },
          {
            title: "Pronóstico de Aceptación y Severidad",
            description:
              "Clasifica la aceptación en LOW (>=75%), MODERATE (50–74%), HIGH (25–49%) o DEALBREAKER (<25%).",
          },
          {
            title: "Objeción Esperada y Guion de Réplica Ronda 2",
            description:
              "Consulta el argumento previsto de la contraparte junto a un guion de réplica listo para copiar en llamadas o correos.",
          },
          {
            title: "Adopción de Compromiso en Un Clic",
            description:
              "Pulsa 'Usar Redacción de Compromiso' para cargar al instante la versión intermedia de Ronda 2 numerada en la tarjeta y previsualizar el diff.",
          },
        ],
      },
      {
        id: "ai-playbook-extractor",
        number: 13,
        title: "Extractor Automático de Playbook desde Contratos Modelo (Golden MSA)",
        badge: "Onboarding Playbook",
        summary:
          "Crea tu Playbook corporativo en segundos pegando cláusulas de un Contrato Modelo firmado o subiendo un archivo .docx/.pdf.",
        keywords: [
          "extractor",
          "contrato modelo",
          "golden msa",
          "auto-save",
          "modo vista previa",
        ],
        steps: [
          {
            title: "Pega Cláusulas Aprobadas o Sube un Archivo .docx/.pdf",
            description:
              "En /playbooks usa 'Pegar Cláusulas' (o pulsa 'Cargar MSA Modelo Ejemplo') o 'Subir DOCX/PDF' para analizar contratos de referencia aprobados.",
            tip: "Los MSA completos con Responsabilidad, Privacidad e IA, SLA, Pagos y Rescisión generan las políticas más completas.",
          },
          {
            title: "Guardado Automático (ADMIN) o Modo Vista Previa",
            description:
              "Con 'Guardar e indexar' marcado (rol ADMIN), las reglas extraídas se vectorizan a 1536-d de inmediato; desmárquelo para inspeccionar candidatos antes de guardar.",
            tip: "El rol VIEWER queda bloqueado con 403 Forbidden en el extractor.",
          },
          {
            title: "Inspección de Candidatos y Guardado Selectivo",
            description:
              "Cada candidato muestra categoría, puntuación de confianza (0–100%), posición estándar, alternativa, disparadores y extracto literal de origen.",
          },
        ],
      },
      {
        id: "ai-semantic-cache-telemetry",
        number: 14,
        title: "Caché Semántica SHA-256 y Telemetría FinOps en Vivo",
        badge: "AI FinOps",
        summary:
          "Evita gasto repetido de tokens con caché semántica SHA-256 (<1ms por acierto) y monitoriza tokens ahorrados, gasto evitado ($) y latencia por operación.",
        keywords: [
          "telemetria",
          "finops",
          "cache semantica",
          "sha-256",
          "tokens ahorrados",
          "coste",
        ],
        steps: [
          {
            title: "Caché Semántica Contextual SHA-256 (<1ms)",
            description:
              "Cada análisis calcula un hash SHA-256 con organización, texto normalizado, título, postura, reglas aplicables y modelo LLM activo. Las cláusulas intactas responden en <1ms sin coste API.",
            tip: "Cambiar postura, editar una cláusula, modificar reglas o cambiar de modelo invalida automáticamente la clave para evitar datos obsoletos.",
          },
          {
            title: "Panel de Métricas en la Pestaña '⚡ Telemetría IA'",
            description:
              "Visualiza Tasa de Acierto de Caché %, Tokens Usados y Ahorrados, Latencia Media, Gasto FinOps Evitado ($ USD) y flujo reciente de invocaciones (CACHÉ vs. INFERENCIA EN VIVO).",
          },
          {
            title: "Purgar Caché Semántica",
            description:
              "Al cambiar de modelo la caché se purga automáticamente, o los revisores autorizados pueden pulsar 'Purgar Caché Semántica' manualmente.",
          },
        ],
      },
    ],
    templates: [
      {
        id: "tpl-lol",
        title: "Limitación Mutua de Responsabilidad y Exclusión de Daños Consecuentes",
        category: "Limitación de Responsabilidad",
        standard_position:
          "La responsabilidad acumulada total de cada parte derivada de este Contrato no excederá de doce (12) meses de tarifas pagadas o pagaderas inmediatamente anteriores a la reclamación, y ninguna parte responderá por daños indirectos, incidentales, especiales o consecuentes.",
        fallback_position:
          "Superlímite mutuo equivalente a dos veces (2x) el valor anual del contrato para obligaciones de privacidad de datos, confidencialidad e indemnidad de propiedad intelectual.",
        unacceptable_triggers:
          "unlimited liability, responsabilidad ilimitada, consequential damages, lucro cesante, exceed $500",
        why_it_works:
          "Detecta de inmediato como riesgo CRÍTICO topes asimétricos bajos (p. ej., '$500') y exposiciones ilimitadas a daños indirectos.",
      },
      {
        id: "tpl-ai-privacy",
        title: "Privacidad de Datos, Confidencialidad Empresarial y Prohibición de Entrenamiento IA",
        category: "Privacidad y Gobernanza IA",
        standard_position:
          "El Cliente conserva todos los derechos y titularidad sobre sus Datos. El Proveedor procesará los Datos del Cliente únicamente para prestar los Servicios contratados, nunca los utilizará para entrenar ni ajustar modelos fundacionales de IA públicos o multiempresa, y notificará cualquier brecha de seguridad confirmada en cuarenta y ocho (48) horas.",
        fallback_position:
          "Plazo de notificación de brechas de setenta y dos (72) horas alineado con el Art. 33 del RGPD; telemetría anonimizada permitida solo para monitorización de infraestructura.",
        unacceptable_triggers:
          "train foundation models, entrenar modelos públicos, licencia perpetua sobre datos, irrevocable license, sin aviso de brecha",
        why_it_works:
          "Protege datos empresariales propietarios y secretos comerciales de RFPs frente a su ingesta en modelos de IA externos.",
      },
      {
        id: "tpl-sla",
        title: "SLA Empresarial de Disponibilidad y Créditos de Servicio Financieros",
        category: "Acuerdo de Nivel de Servicio (SLA)",
        standard_position:
          "El Proveedor garantiza al menos un 99.9% de disponibilidad mensual de la plataforma, respaldado por créditos automáticos del 10% de la tarifa mensual por cada 0.5% por debajo del umbral, y derecho de rescisión por causa justa con reembolso prorrateado tras dos meses consecutivos por debajo del 99.0%.",
        fallback_position:
          "Compromiso de disponibilidad mensual del 99.5% con créditos del 5% por cada 0.5% de caída y rescisión tras tres meses consecutivos de incumplimiento.",
        unacceptable_triggers:
          "as-is, sin garantía, exclusiva discreción, sin créditos de servicio, no reembolsable",
        why_it_works:
          "Marca descargos tipo 'tal cual' (as-is) y ausencia de remedios financieros en acuerdos SaaS y cloud.",
      },
    ],
    heatmapLegend: [
      {
        level: "CRITICAL",
        localizedLevel: "CRÍTICO",
        colorName: "Carmesí",
        badgeClass:
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
        dotClass: "bg-rose-500 border-rose-600/30 dark:border-rose-400",
        meaning:
          "Infracción grave de política o exposición legal/financiera ilimitada (ej. responsabilidad sin límite, cesión unilateral de PI o entrenamiento de modelos públicos de IA con datos confidenciales).",
        recommendedAction:
          "Requiere corrección inmediata mediante 'Aplicar Cambio' o 'Modificar' antes de aprobar el contrato.",
      },
      {
        level: "HIGH",
        localizedLevel: "ALTO",
        colorName: "Ámbar",
        badgeClass:
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
        dotClass: "bg-amber-500 border-amber-600/30 dark:border-amber-400",
        meaning:
          "Desviación material frente a la posición estándar corporativa (ej. indemnización unilateral, ausencia de créditos SLA o jurisdicción no estándar).",
        recommendedAction:
          "Aplica la redacción estándar del Playbook o negocia con la Posición Alternativa preaprobada.",
      },
      {
        level: "MEDIUM / LOW",
        localizedLevel: "MEDIO / BAJO",
        colorName: "Azul Cielo",
        badgeClass:
          "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
        dotClass: "bg-sky-500 border-sky-600/30 dark:bg-sky-400 dark:border-sky-300",
        meaning:
          "Desviación comercial menor, redacción ambigua o nota consultiva que conviene aclarar.",
        recommendedAction:
          "Revisa la justificación e incorpora aclaraciones o una nota para tu equipo.",
      },
      {
        level: "COMPLIANT",
        localizedLevel: "CONFORME",
        colorName: "Esmeralda",
        badgeClass:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
        dotClass: "bg-emerald-500 border-emerald-600/30 dark:border-emerald-400",
        meaning:
          "La cláusula cumple los estándares del Playbook sin disparadores prohibidos, o su cambio ya fue resuelto (ACEPTADO / MODIFICADO).",
        recommendedAction: "Sin acciones pendientes; lista para exportar.",
      },
    ],
    exportComparison: [
      {
        feature: "Caso de Uso Principal",
        trackChanges:
          "Enviar versión marcada a la contraparte o para revisión legal interna.",
        cleanCopy:
          "Copia limpia definitiva lista para firma en DocuSign o firma manuscrita.",
      },
      {
        feature: "Marcado OpenXML de Revisiones",
        trackChanges:
          "Inserta etiquetas nativas <w:del> (tachado) y <w:ins> (subrayado).",
        cleanCopy:
          "Fusiona todas las cláusulas aceptadas/modificadas sin marcas de revisión.",
      },
      {
        feature: "Comentarios y Justificaciones IA",
        trackChanges:
          "Incluye comentarios anclados de Word (<w:commentRangeStart/>) con argumentos.",
        cleanCopy: "Elimina notas internas para entregar un documento limpio.",
      },
      {
        feature: "Sugerencias Rechazadas o Pendientes",
        trackChanges:
          "Conserva intacto el texto original de la contraparte sin alteraciones.",
        cleanCopy:
          "Conserva intacto el texto original de la contraparte sin alteraciones.",
      },
    ],
    faqs: [
      {
        id: "faq-offline-demo",
        question:
          "¿Cuál es la diferencia entre 'Backend Activo' y 'Espacio Demo / Modo Offline'?",
        answer:
          "Cuando el servidor FastAPI está disponible, la insignia superior muestra 'Backend Activo' y aprovisiona una sesión autenticada de tu organización. Si el backend no está accesible, la aplicación cambia sin cortes al Modo Demo usando almacenamiento local del navegador para subir archivos, editar el Playbook y simular auditorías SSE.",
        category: "workflow",
        keywords: ["offline", "demo", "backend", "conexion", "estado"],
      },
      {
        id: "faq-inline-diff",
        question:
          "¿Cómo previsualizo los cambios exactos palabra a palabra antes de aceptar una revisión IA?",
        answer:
          "En el Inspector IA derecho, sitúa el puntero del ratón sobre el botón 'Aplicar Cambio' de cualquier tarjeta. Mientras lo mantienes encima, la cláusula correspondiente en el editor izquierdo muestra palabras borradas en rojo tachado y nuevas palabras en verde.",
        category: "workflow",
        keywords: ["hover", "diff", "previsualizar", "aplicar cambio"],
      },
      {
        id: "faq-conflict-409",
        question:
          "¿Qué ocurre si dos revisores editan la misma cláusula al mismo tiempo?",
        answer:
          "Cada cláusula está protegida por Control de Concurrencia Optimista (v1, v2...). Si un colega resuelve o edita una cláusula mientras ves una versión anterior, el backend rechaza el cambio obsoleto con HTTP 409 Conflict, revierte el estado local de forma segura y muestra una alerta roja.",
        category: "collaboration",
        keywords: ["409", "conflicto", "concurrencia", "version", "rollback"],
      },
      {
        id: "faq-custom-playbook",
        question:
          "¿Las nuevas reglas del Playbook aplican de inmediato al analizar contratos?",
        answer:
          "Sí. Al crear una regla en /playbooks, el backend genera automáticamente su embedding vectorial de 1536 dimensiones e indexa palabras clave. La siguiente auditoría evaluará el contrato contra tus políticas actualizadas al instante.",
        category: "playbook",
        keywords: ["playbook", "reglas", "vector", "inmediato", "analizar"],
      },
      {
        id: "faq-word-compatibility",
        question:
          "¿Los archivos Control Cambios (.docx) exportados son compatibles con Microsoft Word y Google Docs?",
        answer:
          "Sí. El exportador genera un paquete ECMA-376 OpenXML válido con nodos <w:ins> y <w:del>. Al abrirlo en Microsoft Word, LibreOffice Writer o Google Docs, cada inserción o borrado se puede aceptar o rechazar de forma nativa.",
        category: "export",
        keywords: ["word", "google docs", "libreoffice", "docx", "openxml"],
      },
      {
        id: "faq-ai-engine-switcher",
        question:
          "¿Puedo cambiar entre Google Gemini, Groq, OpenAI u Ollama local sin reiniciar Docker?",
        answer:
          "Sí. Pulsa la insignia 'AI: ...' en la barra superior o en el Estudio para abrir el Selector de Motor IA. Elige proveedor, introduce tu API Key o URL base local, pulsa 'Obtener Modelos en Vivo', ejecuta 'Probar Conexión' y haz clic en 'Guardar y Activar Motor'.",
        category: "workflow",
        keywords: ["gemini", "ollama", "groq", "openai", "anthropic", "modelos"],
      },
      {
        id: "faq-ai-config-vault",
        question:
          "¿Cómo guardo mis claves API y modelos entre sesiones sin guardar secretos en texto plano?",
        answer:
          "Dentro del modal de Ajustes IA, baja hasta 'Bóveda de Configuración Cifrada'. Escribe una contraseña de mínimo 8 caracteres y pulsa 'Exportar Bóveda (.rsvault)'. El archivo .rsvault.json se cifra con PBKDF2-HMAC-SHA256 (600,000 iteraciones) y AES-256-GCM para restaurarlo en un clic en cualquier sesión.",
        category: "workflow",
        keywords: ["boveda", "rsvault", "cifrado", "aes-256-gcm", "api key"],
      },
      {
        id: "faq-negotiation-stance",
        question:
          "¿Cómo cambia las sugerencias elegir entre Postura Estricta, Equilibrada o Comercial?",
        answer:
          "La postura determina la posición del Playbook aplicada: 'Estricto' exige la posición estándar sin concesiones; 'Equilibrado' busca términos bilaterales recíprocos; y 'Comercial' adopta límites alternativos preaprobados (como 2x tarifa anual) para acelerar la firma.",
        category: "workflow",
        keywords: ["postura", "estricto", "equilibrado", "comercial"],
      },
      {
        id: "faq-when-to-use-commercial",
        question:
          "¿Cuándo conviene elegir la postura 'Comercial' en lugar de 'Equilibrado' o 'Estricto'?",
        answer:
          "Elige 'Comercial' cuando priorizas velocidad de cierre (fin de trimestre, acuerdos de menor cuantía o renovaciones estándar) y deseas aceptar de entrada las alternativas preaprobadas del Playbook.",
        category: "workflow",
        keywords: ["comercial", "velocidad", "cierre", "alternativa"],
      },
      {
        id: "faq-inline-clause-copilot",
        question:
          "¿Cómo uso el Copiloto IA por Cláusula para personalizar una redacción concreta?",
        answer:
          "Haz clic en '✨ Copiloto IA' dentro de cualquier tarjeta RedlineCard. Elige un chip rápido ('Hacer Estrictamente Mutuo', 'Limitar Responsabilidad a $100,000', etc.) o redacta tu propia instrucción en lenguaje natural y pulsa 'Refinar con IA'.",
        category: "workflow",
        keywords: ["copiloto", "prompt", "refinar", "clausula"],
      },
      {
        id: "faq-copilot-audit-trail",
        question:
          "¿Queda registrado en auditoría el uso del Copiloto IA?",
        answer:
          "Sí. Cada refinamiento del Copiloto registra un evento inmutable SUGGESTION_REFINED en el registro de cumplimiento con el prompt exacto, usuario, rol y marca temporal.",
        category: "collaboration",
        keywords: ["auditoria", "copiloto", "suggestion_refined", "soc 2"],
      },
      {
        id: "faq-cross-clause-radar",
        question:
          "¿Qué es el Radar de Integridad Cruzada y cómo detecta contradicciones?",
        answer:
          "Analiza el grafo completo de cláusulas del contrato para detectar fallos globales invisibles párrafo a párrafo: CONTRADICTION (topes contradictorios o plazos de pago opuestos), BROKEN_REFERENCE (secciones inexistentes) y UNDEFINED_TERM (términos sin definir).",
        category: "workflow",
        keywords: ["radar", "contradiccion", "referencia rota", "integridad"],
      },
      {
        id: "faq-integrity-score-calculation",
        question:
          "¿Cómo se calcula y mejora el Índice de Integridad Documental?",
        answer:
          "Parte de 100% y resta 18 pts por fallo Crítico, 12 pts por Alto, 6 pts por Medio y 3 pts por Bajo (mínimo 15%). Conforme resuelves conflictos y reescaneas, la puntuación vuelve hacia 100%.",
        category: "workflow",
        keywords: ["indice", "integridad", "puntuacion", "penalizacion"],
      },
      {
        id: "faq-critic-verifier-loop",
        question:
          "¿Cómo evita alucinaciones el Bucle Multiagente Crítico-Refinador?",
        answer:
          "El Agente 1 genera el borrador y el Agente 2 (Critic Guard) verifica alineación con el Playbook, ausencia de marcadores ficticios ([TBD]/[INSERT]) y conservación de la numeración legal (p. ej. 1.1). Si falla algo, lo corrige automáticamente y lo marca como Auto-Refinado.",
        category: "workflow",
        keywords: ["critic", "multiagente", "alucinacion", "auto-refinado"],
      },
      {
        id: "faq-critic-verification-gates",
        question:
          "¿Qué significan las insignias ('Verificado', 'Auto-Refinado', 'Revisar') y la Confianza?",
        answer:
          "'Verificado' (verde, 85–99%) aprobó los 3 controles a la primera; 'Auto-Refinado' (azul) indica corrección automática por el Agente Crítico; 'Revisar' (ámbar, <75%) recomienda validación manual por asesor jurídico mediante 'Reverificar con Crítico'.",
        category: "workflow",
        keywords: ["confianza", "verificado", "auto-refinado", "revisar"],
      },
      {
        id: "faq-pushback-simulator",
        question:
          "¿Cómo predice el Simulador de Objeciones la respuesta del abogado contrario?",
        answer:
          "Al pulsar '🎯 Simular Objeción', evalúa la distancia entre el texto de la contraparte, tu propuesta, las alternativas del Playbook y la postura activa para estimar Probabilidad de Aceptación (0–100%), Severidad, objeción principal y réplica Ronda 2.",
        category: "workflow",
        keywords: ["objeciones", "simulador", "aceptacion", "replica"],
      },
      {
        id: "faq-pushback-compromise",
        question:
          "¿Qué pasa al hacer clic en 'Usar Redacción de Compromiso' dentro del Simulador?",
        answer:
          "Carga al instante el texto alternativo intermedio (conservando la numeración legal de la cláusula) en la caja de Redacción Propuesta del Playbook para previsualizar el diff palabra a palabra o aplicarlo en un clic.",
        category: "workflow",
        keywords: ["compromiso", "ronda 2", "alternativa"],
      },
      {
        id: "faq-playbook-auto-extractor",
        question:
          "¿Cómo genero reglas de Playbook automáticamente desde un Contrato Modelo firmado?",
        answer:
          "En /playbooks abre el panel Extractor Automático, pega un texto aprobado (o carga el MSA de ejemplo) o sube un archivo .docx/.pdf. La IA extrae categorías, posiciones estándar/alternativas, frases prohibidas y genera vectores 1536-d.",
        category: "playbook",
        keywords: ["extractor", "contrato modelo", "golden msa", "docx", "pdf"],
      },
      {
        id: "faq-playbook-extractor-rbac",
        question:
          "¿Qué roles pueden ejecutar la extracción con guardado automático frente a Vista Previa?",
        answer:
          "ADMIN, LEGAL_COUNSEL y TECHNICAL_LEAD pueden usar el Modo Vista Previa (auto_save=false). El guardado e indexado masivo directo (auto_save=true) está reservado a ADMIN, y VIEWER recibe 403 Forbidden.",
        category: "playbook",
        keywords: ["rbac", "admin", "vista previa", "403"],
      },
      {
        id: "faq-semantic-cache-freshness",
        question:
          "¿Cambiar de postura o editar el Playbook devolverá resultados antiguos de la caché?",
        answer:
          "Nunca. La clave SHA-256 incluye ID de organización, texto de cláusula, encabezado, postura activa, reglas del Playbook emparejadas y proveedor/modelo LLM. Cualquier cambio genera un hash nuevo.",
        category: "workflow",
        keywords: ["cache", "sha-256", "postura", "frescura"],
      },
      {
        id: "faq-telemetry-purge-cache",
        question:
          "¿Quién puede consultar la Telemetría FinOps IA y purgar la Caché Semántica?",
        answer:
          "Todos los roles autenticados (incluido VIEWER) pueden leer métricas en tiempo real; purgar entradas en caché mediante 'Purgar Caché Semántica' requiere permiso ADMIN, LEGAL_COUNSEL o TECHNICAL_LEAD.",
        category: "workflow",
        keywords: ["telemetria", "purgar", "finops", "rbac"],
      },
    ],
  },
  fr: {
    modules: [
      {
        id: "quick-start",
        number: 1,
        title: "Démarrage Rapide : Le Flux de Révision Contractuelle en 4 Étapes",
        badge: "Prise en Main",
        summary:
          "Passez d'un contrat tiers ou appel d'offres brut à un document Microsoft Word révisé et conforme à vos politiques en quatre étapes structurées.",
        keywords: [
          "demarrage rapide",
          "flux",
          "4 etapes",
          "importer",
          "analyser",
          "playbook",
          "exporter",
        ],
        steps: [
          {
            title: "Étape 1 : Définir ou Vérifier votre Playbook (/playbooks)",
            description:
              "Avant d'auditer un accord, vérifiez vos standards de négociation dans le Gestionnaire Playbook. Chaque règle stocke Position Standard, Position de Repli et Déclencheurs Bloquants.",
            tip: "Dès l'installation, votre espace comprend 5 politiques juridiques d'entreprise préconfigurées (Responsabilité, Indemnisation, SLA, Confidentialité IA et Droit Applicable).",
          },
          {
            title: "Étape 2 : Importer votre Contrat ou RFP sur le Tableau de Bord (/)",
            description:
              "Glissez-déposez un accord .docx ou .pdf (jusqu'à 25 Mo). L'analyseur structurel extrait chaque clause en préservant la numérotation juridique (ex. 1.1, Article IV).",
          },
          {
            title: "Étape 3 : Cliquer sur 'Analyser le Contrat' dans le Studio",
            description:
              "Dans le Studio double écran, cliquez sur 'Analyser le Contrat'. Le moteur hybride vectoriel + lexical associe chaque clause à votre Playbook et diffuse les révisions en temps réel via SSE.",
          },
          {
            title: "Étape 4 : Prévisualiser les Diffs, Résoudre et Exporter en Word (.docx)",
            description:
              "Survolez 'Appliquer' pour visualiser suppressions barrées et ajouts mot à mot dans l'éditeur. Acceptez, Modifiez ou Rejetez chaque proposition et exportez avec Suivi des Modifications ou Copie Propre.",
          },
        ],
      },
      {
        id: "uploading-contracts",
        number: 2,
        title: "Import de Contrats & RFPs (.docx et .pdf)",
        badge: "Ingestion & Parsing",
        summary:
          "Découvrez comment le pipeline structurel préserve la hiérarchie juridique, regroupe les sous-clauses et sécurise les fichiers importés.",
        keywords: [
          "importer",
          "docx",
          "pdf",
          "parseur",
          "clause",
          "numerotation",
          "25 mo",
        ],
        steps: [
          {
            title: "Préservation de la Numérotation & Hiérarchie Juridique",
            description:
              "Le segmenteur d'états reconnaît les schémas hiérarchiques (1., 1.1, 1.1.1, Article I, Section 2) et rattache les sous-clauses ((a), (b), (i), (ii)) à leur article parent.",
          },
          {
            title: "Nettoyage des En-têtes & Sécurité OpenXML",
            description:
              "Pour les PDF, les en-têtes/pieds de page répétitifs sont retirés automatiquement. Pour les fichiers Word (.docx), la validation binaire bloque les attaques Zip-Slip et XXE.",
          },
          {
            title: "Import Rapide depuis le Studio (+ Importer)",
            description:
              "Besoin de basculer sur une nouvelle version adverse reçue par e-mail ? Cliquez sur 'Importer' dans la barre du Studio pour ingérer le document sans quitter l'espace de travail.",
          },
        ],
      },
      {
        id: "writing-playbook-rules",
        number: 3,
        title: "Rédiger des Règles Playbook Efficaces (/playbooks)",
        badge: "Ingénierie Playbook",
        summary:
          "Configurez des standards d'entreprise précis afin que le moteur hybride Vecteur + BM25 sélectionne la règle exacte pour chaque clause.",
        keywords: [
          "playbook",
          "regles",
          "position standard",
          "position repli",
          "vecteur",
          "bm25",
        ],
        steps: [
          {
            title: "Fonctionnement du Moteur Hybride Vecteur + Lexical",
            description:
              "L'évaluation combine similarité sémantique vectorielle 1536-d (poids 70 %) et recherche lexicale BM25 (poids 30 %) pour identifier les 3 règles applicables en moins de 150 ms.",
          },
          {
            title: "Catégorie & Position Standard (Exigence de Référence)",
            description:
              "Employez des catégories claires (Limitation de Responsabilité, Indemnisation, Données & IA, PI) et rédigez une Position Standard prête à insérer.",
          },
          {
            title: "Position de Repli (Plancher Autorisé de Négociation)",
            description:
              "Précisez la clause de repli préapprouvée si le cocontractant refuse votre position standard (ex. super-plafond 2x annuel plutôt que 12 mois).",
          },
          {
            title: "Déclencheurs Bloquants (Alertes Rouges)",
            description:
              "Listez les termes déclenchant immédiatement un risque CRITIQUE ou ÉLEVÉ : 'responsabilité illimitée', 'seule discrétion', 'dommages indirects' ou 'entraîner modèles publics'.",
          },
        ],
      },
      {
        id: "mastering-studio",
        number: 4,
        title: "Maîtriser le Studio de Révision Double Écran (/documents/[id])",
        badge: "Espace Interactif",
        summary:
          "Naviguez à 60 FPS grâce à la synchronisation bidirectionnelle, la gouttière des risques, les diffs en ligne et la résolution en un clic.",
        keywords: [
          "studio",
          "double ecran",
          "carte risques",
          "diff",
          "appliquer",
          "modifier",
          "rejeter",
        ],
        steps: [
          {
            title: "Synchronisation Bidirectionnelle Éditeur ↔ Inspecteur",
            description:
              "Cliquer sur une clause dans l'éditeur gauche met instantanément en évidence sa fiche IA correspondante à droite en 16 ms, et inversement.",
          },
          {
            title: "Aperçu Mot à Mot en Ligne au Survol",
            description:
              "Survolez le bouton 'Appliquer' d'une carte IA : le contrat affiche aussitôt les mots supprimés barrés en rouge et les ajouts Playbook en vert émeraude.",
          },
          {
            title: "Résolution en Un Clic : Appliquer, Modifier ou Rejeter",
            description:
              "Cliquez sur 'Appliquer' pour adopter la rédaction IA, 'Modifier' pour éditer le texte avant validation, ou 'Rejeter' pour conserver la rédaction adverse d'origine.",
          },
          {
            title: "Argumentaires Prêts pour la Négociation Externe",
            description:
              "Chaque carte sépare la Justification Interne et l'Argumentaire de Négociation copiable en un clic pour vos échanges avec le conseil adverse.",
          },
        ],
      },
      {
        id: "collaboration-concurrency-audit",
        number: 5,
        title: "Collaboration d'Équipe, Verrous Optimistes & Journal d'Audit",
        badge: "Gouvernance & Concurrence",
        summary:
          "Collaborez entre directions juridique, achats et technique avec discussions ciblées, protection anti-écrasement 409 et piste d'audit immuable.",
        keywords: [
          "collaboration",
          "commentaires",
          "version",
          "concurrence",
          "conflit 409",
          "audit",
          "rbac",
        ],
        steps: [
          {
            title: "Fils de Discussion Repliables par Clause",
            description:
              "Chaque clause dispose d'un volet dédié en bas de l'Inspecteur IA pour consigner des notes contextuelles liées durablement à cette clause.",
          },
          {
            title: "Verrouillage Optimiste & Versions (v1 → v2)",
            description:
              "Chaque clause affiche son numéro de version (v1, v2…). En cas de modification concurrente par un collègue, l'API renvoie HTTP 409 Conflict et restaure proprement votre état local.",
          },
          {
            title: "Journal Immuable de Conformité",
            description:
              "Basculer sur l'onglet 'Journal' révèle la trace chronologique infalsifiable des imports, audits IA, résolutions, commentaires et exports Word.",
          },
        ],
      },
      {
        id: "exporting-word-docx",
        number: 6,
        title: "Export Microsoft Word (Suivi des Modifications vs. Copie Propre .docx)",
        badge: "Export OpenXML",
        summary:
          "Générez des fichiers .docx OpenXML authentiques intégrant le Suivi des Modifications Word (<w:ins> et <w:del>) ou des versions prêtes à signer.",
        keywords: [
          "export",
          "word",
          "docx",
          "suivi modifications",
          "copie propre",
          "openxml",
        ],
        steps: [
          {
            title: "Suivi Modifs (.docx) pour la Négociation Adverse",
            description:
              "Produit un fichier Word natif avec balises <w:del> et <w:ins>, auteur, horodatage, justifications IA et commentaires en marge, compatible Word, LibreOffice et Google Docs.",
          },
          {
            title: "Copie Propre (.docx) pour Signature Finale",
            description:
              "Fusionne toutes les clauses ACCEPTÉES et MODIFIÉES sans aucune trace de révision ni annotation interne pour une signature immédiate.",
          },
        ],
      },
      {
        id: "ai-engine-switcher",
        number: 7,
        title: "Sélecteur Dynamique de Fournisseur & Modèle IA (Cloud & Local)",
        badge: "Changement à Chaud",
        summary:
          "Configurez, testez la latence et changez à chaud vos moteurs LLM et Embeddings 1536-d depuis l'en-tête sans redémarrage.",
        keywords: [
          "parametres ia",
          "fournisseur",
          "gemini",
          "groq",
          "openai",
          "anthropic",
          "ollama",
          "coffre",
          "rsvault",
        ],
        steps: [
          {
            title: "Ouvrir le Sélecteur Moteur IA",
            description:
              "Cliquez sur le badge 'AI: ...' dans la barre de navigation ou du Studio pour afficher le panneau de configuration LLM & Vecteurs.",
          },
          {
            title: "Découverte en Direct (/models) ou Saisie Manuelle",
            description:
              "Choisissez Déterministe, Google Gemini, Groq LPU, OpenAI, Anthropic Claude, Ollama local ou vLLM. Cliquez sur 'Modèles en Direct' pour interroger l'API du fournisseur ou saisissez tout Model ID personnalisé.",
          },
          {
            title: "Test de Connexion avant Activation",
            description:
              "Lancez 'Tester la Connexion' pour vérifier l'adaptation vectorielle 1536-d, la sortie structurée et la latence avant de valider avec 'Enregistrer & Activer'.",
          },
          {
            title: "Sauvegarde Chiffrée via Coffre-Fort (.rsvault.json)",
            description:
              "Les clés API ne sont jamais stockées en clair sur disque. Exportez un coffre .rsvault.json chiffré par AES-256-GCM + PBKDF2 (600 000 itérations) pour restaurer toute votre configuration en un clic.",
          },
        ],
      },
      {
        id: "negotiation-stance-selector",
        number: 8,
        title: "Sélecteur de Posture de Négociation IA (Strict vs. Équilibré vs. Commercial)",
        badge: "Posture Négociation",
        summary:
          "Adaptez automatiquement l'exigence des révisions IA : Strict (zéro concession), Équilibré (bilatéral) ou Commercial (repli rapide).",
        keywords: [
          "posture",
          "strict",
          "equilibre",
          "commercial",
          "velocite",
        ],
        steps: [
          {
            title: "Posture Stricte : Gouvernance sans Compromis",
            description:
              "Applique strictement votre position standard sur chaque clause, classe les écarts en CRITIQUE/ÉLEVÉ sous l'étiquette [Posture Stricte Protectrice] et fournit des arguments fermes.",
            tip: "Idéal lorsque le rapport de force vous est favorable ou pour les contrats critiques d'infrastructure et de PI.",
          },
          {
            title: "Posture Équilibrée : Réciprocité Bilatérale (Par Défaut)",
            description:
              "Transforme les obligations unilatérales en engagements mutuels ('Chaque partie...') sous l'étiquette [Posture Mutuelle Équilibrée].",
            tip: "Recommandée pour 80 % des contrats commerciaux courants.",
          },
          {
            title: "Posture Commerciale : Vélocité de Signature",
            description:
              "Retient directement les positions de repli préapprouvées (ex. plafond 2x annuel) afin d'éviter les allers-retours prolongés sous l'étiquette [Posture Commerciale Rapide].",
            tip: "Parfaite en fin de trimestre ou sur des renouvellements SaaS à faible risque.",
          },
          {
            title: "Changement Instantané dans la Barre du Studio",
            description:
              "Basculez entre Strict, Équilibré et Commercial avant de cliquer sur 'Analyser le Contrat' et relancez l'audit à tout moment.",
          },
        ],
      },
      {
        id: "inline-clause-ai-copilot",
        number: 9,
        title: "Copilote IA par Clause & Directives en Langage Naturel",
        badge: "Copilote IA",
        summary:
          "Guidez finement l'IA sur chaque clause par prompt libre ou raccourcis dédiés (plafonds financiers, préavis, réciprocité, ton).",
        keywords: [
          "copilote",
          "prompt",
          "plafond",
          "preavis",
          "reciproque",
          "affiner",
        ],
        steps: [
          {
            title: "Ouvrir le Tiroir Copilote IA",
            description:
              "Cliquez sur '✨ Copilote IA' sur n'importe quelle carte pour afficher 4 raccourcis prédéfinis et la zone de prompt libre.",
            tip: "Fonctionne aussi bien avec le moteur local qu'avec Gemini, Groq, OpenAI, Anthropic ou Ollama.",
          },
          {
            title: "Boutons de Directive Rapide en Un Clic",
            description:
              "Rendez la clause strictement mutuelle, plafonnez à 100 000 $, ajoutez un préavis de remédiation de 30 jours ou adoucissez le ton pour un partenaire stratégique.",
          },
          {
            title: "Prompt Libre en Langage Naturel",
            description:
              "Saisissez votre consigne précise (ex. 'Plafonner à 250 000 $ et exiger un audit SOC 2 Type II sous 14 jours') puis cliquez sur 'Refine with AI'.",
            tip: "Régénère le texte proposé, la balise de justification et l'argumentaire exécutif associé.",
          },
          {
            title: "Traçabilité dans le Journal de Conformité",
            description:
              "Chaque affinement génère un événement immuable SUGGESTION_REFINED avec l'instruction exacte et l'identité du réviseur.",
          },
        ],
      },
      {
        id: "cross-clause-radar",
        number: 10,
        title: "Radar d'Intégrité, Contradictions & Renvois Inter-Clauses",
        badge: "Intégrité Documentaire",
        summary:
          "Détecte les contradictions entre clauses distantes, les renvois vers des articles inexistants et les termes non définis avec un Score d'Intégrité 0–100 %.",
        keywords: [
          "radar",
          "contradiction",
          "renvoi casse",
          "terme non defini",
          "score integrite",
        ],
        steps: [
          {
            title: "Limites de l'Analyse Clause par Clause",
            description:
              "Des défauts majeurs n'apparaissent qu'en croisant le contrat : plafond de 500 $ à l'article 1 face à une indemnisation illimitée à l'article 8, ou délais Net 30 vs Net 15.",
            tip: "Le Radar analyse le graphe documentaire complet.",
          },
          {
            title: "Les 3 Catégories d'Anomalies",
            description:
              "Identifie : 1) CONTRADICTION (conflits de plafonds, délais ou gouvernance IA), 2) BROKEN_REFERENCE (renvois erronés vers une Section 99.4 inexistante) et 3) UNDEFINED_TERM.",
          },
          {
            title: "Score d'Intégrité Documentaire (0–100 %)",
            description:
              "Démarre à 100 % avec pénalités pondérées (Critique -18 pts, Élevé -12 pts, Moyen -6 pts, Faible -3 pts, plancher 15 %). Corriger les anomalies remonte le score.",
          },
          {
            title: "Navigation Bilatérale en Un Clic",
            description:
              "Les boutons 'Source : Clause #X' et 'Conflit avec : Clause #Y' font défiler directement l'éditeur jusqu'aux dispositions concernées.",
          },
          {
            title: "Enregistrement SOC 2 Immuable",
            description:
              "Chaque scan enregistre un événement CROSS_CLAUSE_CHECKED avec le décompte et le score.",
          },
        ],
      },
      {
        id: "critic-verifier-guard",
        number: 11,
        title: "Boucle Multi-Agents Critique-Raffineur & Garde Anti-Hallucinations",
        badge: "Vérification Multi-Agents",
        summary:
          "Chaque proposition passe par un pipeline à 2 agents : Rédacteur (Agent 1) → Garde Critique (Agent 2), contrôlant politique, placeholders et numérotation.",
        keywords: [
          "garde critique",
          "multi-agents",
          "hallucination",
          "verifie",
          "auto-affine",
        ],
        steps: [
          {
            title: "Pipeline 2 Agents : Rédacteur → Vérificateur Critique",
            description:
              "L'Agent 2 audite systématiquement chaque rédaction issue d'un audit complet ou du Copilote IA et corrige automatiquement les défauts avant affichage.",
            tip: "Empêche les omissions de numérotation ou les fuites de formulations interdites.",
          },
          {
            title: "Les 3 Barrières Obligatoires",
            description:
              "1) Conforme Politique : élimine les termes interdits ; 2) Sans Hallucination : purge tout jeton [TBD] ou [INSERT] ; 3) Obligations & Numérotation Préservées (ex. 1.1).",
          },
          {
            title: "Badges de Confiance : Vérifié vs. Auto-Affiné vs. Révision Requise",
            description:
              "'🛡️ Vérifié' (85–99 %) a passé les 3 barrières ; '✨ Auto-Affiné' signale une correction automatique par l'Agent 2 ; '⚠️ Révision Requise' (<75 %) alerte sur une faible couverture Playbook.",
          },
          {
            title: "Revérification à la Demande",
            description:
              "Après modification manuelle, cliquez sur 'Revérifier avec Critique' pour relancer les 3 contrôles et consigner SUGGESTION_VERIFIED.",
          },
        ],
      },
      {
        id: "counterparty-pushback-simulator",
        number: 12,
        title: "Simulateur de Contre-Arguments Adverses & Riposte Tour 2",
        badge: "Préparation Négociation",
        summary:
          "Simulez la réaction du conseil adverse avant envoi : Probabilité d'Acceptation (0–100 %), Sévérité, objection probable, script Tour 2 et clause de compromis.",
        keywords: [
          "simulateur",
          "contre-arguments",
          "objection",
          "tour 2",
          "compromis",
        ],
        steps: [
          {
            title: "Déclencher la Simulation Adverse",
            description:
              "Cliquez sur '🎯 Simuler Réponse' sur une carte pour évaluer l'écart entre clause initiale, proposition, repli Playbook et posture active.",
            tip: "La posture Stricte met en lumière les points durs ; la posture Commerciale accroît l'acceptation prévue.",
          },
          {
            title: "Probabilité d'Acceptation & Sévérité",
            description:
              "Classement en LOW (>=75 %), MODERATE (50–74 %), HIGH (25–49 %) ou DEALBREAKER (<25 %).",
          },
          {
            title: "Objection Attendue & Script Copiable",
            description:
              "Consultez l'objection la plus forte prévue et copiez le script de riposte Tour 2 en un clic.",
          },
          {
            title: "Clause de Compromis en Un Clic",
            description:
              "Cliquez sur 'Use Compromise Wording' pour charger instantanément la version intermédiaire numérotée et visualiser son diff.",
          },
        ],
      },
      {
        id: "ai-playbook-extractor",
        number: 13,
        title: "Extracteur Automatique de Playbook depuis Contrats Modèles",
        badge: "Onboarding Playbook",
        summary:
          "Constituez votre Playbook en quelques secondes en collant un Contrat Modèle signé (Golden MSA) ou en important un fichier .docx/.pdf.",
        keywords: [
          "extracteur",
          "contrat modele",
          "golden msa",
          "apercu",
          "vecteurs",
        ],
        steps: [
          {
            title: "Coller des Clauses Approuvées ou Importer .docx/.pdf",
            description:
              "Dans /playbooks, utilisez 'Coller Clauses' (ou 'Charger MSA Modèle Exemple') ou 'Importer DOCX/PDF' sur vos modèles approuvés.",
            tip: "Les accords couvrant Responsabilité, Données IA, SLA, Paiement et Résiliation produisent les règles les plus riches.",
          },
          {
            title: "Enregistrement Automatique (ADMIN) ou Mode Aperçu",
            description:
              "ADMIN peut enregistrer et indexer directement en 1536-d ; Juristes et Tech Leads peuvent prévisualiser les candidats avant ajout sélectif. VIEWER reçoit 403 Forbidden.",
            tip: "Désactivez l'enregistrement auto pour relire chaque règle extraite avant publication.",
          },
          {
            title: "Examen et Validation Sélective",
            description:
              "Chaque candidat indique catégorie, confiance (0–100 %), positions standard/repli, déclencheurs et extrait source exact.",
          },
        ],
      },
      {
        id: "ai-semantic-cache-telemetry",
        number: 14,
        title: "Cache Sémantique SHA-256 & Télémétrie FinOps IA en Direct",
        badge: "AI FinOps",
        summary:
          "Éliminez les appels redondants grâce au cache sémantique SHA-256 (<1 ms) et suivez jetons économisés, dépenses évitées ($) et latence par opération.",
        keywords: [
          "telemetrie",
          "finops",
          "cache semantique",
          "sha-256",
          "economies",
        ],
        steps: [
          {
            title: "Cache Sémantique SHA-256 (<1 ms)",
            description:
              "Chaque clé SHA-256 combine organisation, texte normalisé, titre, posture, règles Playbook et modèle LLM actif. Toute clause inchangée répond en <1 ms sans coût externe.",
            tip: "Tout changement de posture, règle ou modèle génère une nouvelle clé fraîche.",
          },
          {
            title: "Tableau FinOps sous '⚡ Télémétrie IA'",
            description:
              "Affiche Taux de Succès Cache %, Jetons Économisés, Latence Moyenne, Dépense Évitée ($ USD) et flux temps réel (CACHE vs INFÉRENCE DIRECTE).",
          },
          {
            title: "Purge du Cache Sémantique",
            description:
              "Le changement de modèle vide automatiquement le cache ; ADMIN, Juriste et Tech Lead peuvent aussi purger manuellement.",
          },
        ],
      },
    ],
    templates: [
      {
        id: "tpl-lol",
        title: "Plafonnement Mutuel de Responsabilité & Exclusion des Dommages Indirects",
        category: "Limitation de Responsabilité",
        standard_position:
          "La responsabilité cumulée totale de chaque partie au titre du présent Contrat n'excédera pas douze (12) mois de redevances payées ou dues précédant immédiatement la réclamation, et aucune partie ne sera responsable des dommages indirects, spéciaux ou consécutifs.",
        fallback_position:
          "Super-plafond mutuel égal à deux fois (2x) la valeur annuelle du contrat pour la protection des données, la confidentialité et la garantie d'éviction PI.",
        unacceptable_triggers:
          "unlimited liability, responsabilité illimitée, dommages indirects, perte de profit, exceed $500",
        why_it_works:
          "Signale immédiatement comme CRITIQUE les plafonds asymétriques faibles (ex. 500 $) et l'exposition illimitée aux dommages indirects.",
      },
      {
        id: "tpl-ai-privacy",
        title: "Confidentialité des Données & Interdiction d'Entraînement IA",
        category: "Données & Gouvernance IA",
        standard_position:
          "Le Client conserve l'intégralité des droits de propriété sur ses Données. Le Prestataire traite les Données Client exclusivement pour fournir les Services, s'interdit d'entraîner des modèles d'IA fondation publics ou multi-locataires sur ces Données, et notifie toute violation de sécurité confirmée sous quarante-huit (48) heures.",
        fallback_position:
          "Délai de notification de soixante-douze (72) heures conforme à l'article 33 du RGPD ; télémétrie anonymisée admise uniquement pour la supervision d'infrastructure.",
        unacceptable_triggers:
          "train foundation models, entraîner modèles publics, licence perpétuelle sur données client, sans notification",
        why_it_works:
          "Protège les données stratégiques et secrets d'affaires contre toute réutilisation dans des modèles d'IA externes.",
      },
      {
        id: "tpl-sla",
        title: "SLA de Disponibilité Entreprise & Crédits Financiers",
        category: "Accord de Niveau de Service (SLA)",
        standard_position:
          "Le Prestataire garantit une disponibilité mensuelle minimale de 99,9 %, assortie de crédits automatiques de 10 % de la facture mensuelle par tranche de 0,5 % en deçà du seuil, et d'un droit de résiliation avec remboursement au prorata après deux mois consécutifs sous 99,0 %.",
        fallback_position:
          "Engagement mensuel de 99,5 % avec crédits de 5 % par tranche de 0,5 % et résiliation après trois mois consécutifs de manquement.",
        unacceptable_triggers:
          "as-is, sans garantie, seule discrétion, aucun crédit de service, non remboursable",
        why_it_works:
          "Détecte les clauses 'en l'état' et l'absence de pénalités financières dans les contrats SaaS et cloud.",
      },
    ],
    heatmapLegend: [
      {
        level: "CRITICAL",
        localizedLevel: "CRITIQUE",
        colorName: "Carmin",
        badgeClass:
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
        dotClass: "bg-rose-500 border-rose-600/30 dark:border-rose-400",
        meaning:
          "Violation sévère de politique interne ou exposition financière illimitée (responsabilité sans plafond, cession de PI ou entraînement IA sur données confidentielles).",
        recommendedAction:
          "Nécessite une révision immédiate via 'Appliquer' ou 'Modifier' avant validation.",
      },
      {
        level: "HIGH",
        localizedLevel: "ÉLEVÉ",
        colorName: "Ambre",
        badgeClass:
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
        dotClass: "bg-amber-500 border-amber-600/30 dark:border-amber-400",
        meaning:
          "Écart matériel par rapport à la position standard (indemnisation unilatérale, absence de crédits SLA ou loi étrangère).",
        recommendedAction:
          "Appliquer le texte standard du Playbook ou négocier avec la Position de Repli.",
      },
      {
        level: "MEDIUM / LOW",
        localizedLevel: "MOYEN / FAIBLE",
        colorName: "Bleu Ciel",
        badgeClass:
          "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
        dotClass: "bg-sky-500 border-sky-600/30 dark:bg-sky-400 dark:border-sky-300",
        meaning:
          "Écart commercial mineur, formulation ambiguë ou recommandation de clarification.",
        recommendedAction:
          "Vérifier l'analyse et apporter une précision ou un commentaire d'équipe.",
      },
      {
        level: "COMPLIANT",
        localizedLevel: "CONFORME",
        colorName: "Émeraude",
        badgeClass:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
        dotClass: "bg-emerald-500 border-emerald-600/30 dark:border-emerald-400",
        meaning:
          "La clause respecte le Playbook sans élément bloquant ou sa révision a été acceptée/modifiée.",
        recommendedAction: "Aucune action requise ; prêt pour export.",
      },
    ],
    exportComparison: [
      {
        feature: "Usage Principal",
        trackChanges:
          "Envoi du projet annoté au conseil adverse ou revue juridique interne.",
        cleanCopy:
          "Version finale propre prête pour signature DocuSign ou manuscrite.",
      },
      {
        feature: "Balisage OpenXML de Révision",
        trackChanges:
          "Intègre les balises natives <w:del> (barré) et <w:ins> (souligné).",
        cleanCopy:
          "Fusionne les clauses acceptées/modifiées sans aucune marque de révision.",
      },
      {
        feature: "Commentaires & Justifications IA",
        trackChanges:
          "Inclut les commentaires Word ancrés (<w:commentRangeStart/>) avec arguments.",
        cleanCopy: "Supprime toutes les notes internes pour une diffusion externe.",
      },
      {
        feature: "Propositions Rejetées ou en Attente",
        trackChanges:
          "Conserve intact le texte adverse d'origine sans modification.",
        cleanCopy:
          "Conserve intact le texte adverse d'origine sans modification.",
      },
    ],
    faqs: [
      {
        id: "faq-offline-demo",
        question:
          "Quelle est la différence entre 'Backend Actif' et le 'Mode Démo Hors-Ligne' ?",
        answer:
          "Lorsque le serveur FastAPI est actif, le badge supérieur affiche 'Backend Actif' et crée une session authentifiée. S'il est injoignable, l'application bascule sans rupture en Mode Démo sur stockage navigateur afin d'importer des fichiers, éditer le Playbook et tester toutes les fonctions.",
        category: "workflow",
        keywords: ["hors-ligne", "demo", "backend", "connexion"],
      },
      {
        id: "faq-inline-diff",
        question:
          "Comment prévisualiser les changements exacts mot à mot avant d'accepter une révision IA ?",
        answer:
          "Dans l'Inspecteur IA à droite, survolez le bouton 'Appliquer' sur n'importe quelle carte. La clause correspondante dans l'éditeur à gauche affiche instantanément les suppressions barrées en rouge et les ajouts en vert.",
        category: "workflow",
        keywords: ["survol", "diff", "apercu", "appliquer"],
      },
      {
        id: "faq-conflict-409",
        question:
          "Que se passe-t-il si deux réviseurs modifient la même clause simultanément ?",
        answer:
          "Chaque clause utilise un contrôle de concurrence optimiste (v1, v2…). Si un collègue valide la clause juste avant vous, le serveur rejette la mise à jour obsolète avec HTTP 409 Conflict, annule proprement l'édition locale et affiche une bannière d'alerte.",
        category: "collaboration",
        keywords: ["409", "conflit", "concurrence", "version"],
      },
      {
        id: "faq-custom-playbook",
        question:
          "Les nouvelles règles du Playbook s'appliquent-elles immédiatement à l'analyse ?",
        answer:
          "Oui. Dès qu'une règle est ajoutée dans /playbooks, le serveur calcule son vecteur 1536-d et indexe ses mots-clés. L'audit suivant en tient immédiatement compte.",
        category: "playbook",
        keywords: ["playbook", "regles", "vecteur", "immediat"],
      },
      {
        id: "faq-word-compatibility",
        question:
          "Les fichiers Suivi Modifs (.docx) sont-ils compatibles avec Microsoft Word et Google Docs ?",
        answer:
          "Oui. L'exportateur produit un package OpenXML ECMA-376 standard utilisant les balises <w:ins> et <w:del>. Word, LibreOffice Writer et Google Docs reconnaissent chaque insertion et suppression nativement.",
        category: "export",
        keywords: ["word", "google docs", "libreoffice", "docx"],
      },
      {
        id: "faq-ai-engine-switcher",
        question:
          "Puis-je passer de Google Gemini à Groq, OpenAI ou Ollama local sans redémarrer Docker ?",
        answer:
          "Oui. Cliquez sur le badge 'AI: ...' en haut pour ouvrir le Sélecteur Moteur IA. Choisissez votre fournisseur, saisissez clé API ou URL locale, cliquez sur 'Modèles en Direct', testez la connexion et activez sans redémarrage.",
        category: "workflow",
        keywords: ["gemini", "ollama", "groq", "openai", "anthropic"],
      },
      {
        id: "faq-ai-config-vault",
        question:
          "Comment sauvegarder mes clés API entre sessions sans stockage en clair sur disque ?",
        answer:
          "Utilisez la section 'Coffre de Configuration Chiffré' dans la fenêtre IA : saisissez un mot de passe (min. 8 caractères) et exportez un fichier .rsvault.json protégé par PBKDF2-HMAC-SHA256 (600 000 itérations) + AES-256-GCM.",
        category: "workflow",
        keywords: ["coffre", "rsvault", "chiffrement", "aes-256-gcm"],
      },
      {
        id: "faq-negotiation-stance",
        question:
          "Comment la Posture de Négociation (Strict, Équilibré, Commercial) modifie-t-elle les révisions ?",
        answer:
          "'Strict' applique votre position standard sans compromis ; 'Équilibré' privilégie des clauses bilatérales ; 'Commercial' retient vos positions de repli préapprouvées (ex. plafond 2x) pour conclure plus vite.",
        category: "workflow",
        keywords: ["posture", "strict", "equilibre", "commercial"],
      },
      {
        id: "faq-when-to-use-commercial",
        question:
          "Quand choisir la posture 'Commercial' plutôt que 'Équilibré' ou 'Strict' ?",
        answer:
          "Utilisez 'Commercial' lorsque la rapidité de signature prime (fin de trimestre, faibles enjeux ou accords proches de vos seuils de repli autorisés).",
        category: "workflow",
        keywords: ["commercial", "velocite", "signature"],
      },
      {
        id: "faq-inline-clause-copilot",
        question:
          "Comment utiliser le Copilote IA par Clause pour affiner une clause précise ?",
        answer:
          "Cliquez sur '✨ Copilote IA' sur une fiche de l'inspecteur, choisissez un raccourci ou saisissez une instruction libre en langage naturel, puis validez pour régénérer le texte et l'argumentaire.",
        category: "workflow",
        keywords: ["copilote", "prompt", "affiner"],
      },
      {
        id: "faq-copilot-audit-trail",
        question:
          "L'utilisation du Copilote IA est-elle tracée dans le journal d'audit ?",
        answer:
          "Oui. Chaque modification génère un événement immuable SUGGESTION_REFINED conservant l'instruction exacte, le rôle utilisateur et l'horodatage.",
        category: "collaboration",
        keywords: ["audit", "copilote", "suggestion_refined"],
      },
      {
        id: "faq-cross-clause-radar",
        question:
          "Qu'est-ce que le Radar d'Intégrité Inter-Clauses et comment repère-t-il les contradictions ?",
        answer:
          "Il inspecte tout le graphe du contrat pour relever les défauts globaux : CONTRADICTION (plafonds ou délais opposés), BROKEN_REFERENCE (sections absentes) et UNDEFINED_TERM (termes sans définition).",
        category: "workflow",
        keywords: ["radar", "contradiction", "renvoi", "integrite"],
      },
      {
        id: "faq-integrity-score-calculation",
        question:
          "Comment est calculé et amélioré le Score d'Intégrité Documentaire ?",
        answer:
          "Il démarre à 100 % et retranche 18 pts par anomalie Critique, 12 pts par Élevée, 6 pts par Moyenne et 3 pts par Faible (plancher à 15 %). Résoudre les incohérences remonte le score vers 100 %.",
        category: "workflow",
        keywords: ["score", "integrite", "calcul"],
      },
      {
        id: "faq-critic-verifier-loop",
        question:
          "Comment la boucle Critique-Raffineur empêche-t-elle les hallucinations IA ?",
        answer:
          "L'Agent 1 rédige la révision et l'Agent 2 (Garde Critique) contrôle la conformité Playbook, supprime les placeholders ([TBD]/[INSERT]) et préserve la numérotation légale, réparant automatiquement tout écart.",
        category: "workflow",
        keywords: ["garde critique", "hallucination", "multi-agents"],
      },
      {
        id: "faq-critic-verification-gates",
        question:
          "Que signifient les badges ('Vérifié', 'Auto-Affiné', 'Révision Requise') ?",
        answer:
          "'Vérifié' (85–99 %) a réussi tous les contrôles dès le premier passage ; 'Auto-Affiné' indique une correction par l'Agent Critique ; 'Révision Requise' (<75 %) invite le juriste à contrôler puis revérifier manuellement.",
        category: "workflow",
        keywords: ["confiance", "verifie", "auto-affine"],
      },
      {
        id: "faq-pushback-simulator",
        question:
          "Comment le Simulateur anticipe-t-il les objections du conseil adverse ?",
        answer:
          "En cliquant sur '🎯 Simuler Réponse', l'agent analyse l'écart entre texte adverse, proposition, repli Playbook et posture pour calculer Probabilité d'Acceptation (0–100 %), Sévérité, objection probable et script Tour 2.",
        category: "workflow",
        keywords: ["simulateur", "objections", "riposte"],
      },
      {
        id: "faq-pushback-compromise",
        question:
          "Que fait le bouton 'Use Compromise Wording' dans le Simulateur ?",
        answer:
          "Il charge immédiatement la rédaction de compromis Tour 2 (numérotation préservée) dans la zone de rédaction proposée afin d'en inspecter le diff ou de l'appliquer en un clic.",
        category: "workflow",
        keywords: ["compromis", "tour 2", "repli"],
      },
      {
        id: "faq-playbook-auto-extractor",
        question:
          "Comment générer des règles Playbook depuis un Contrat Modèle existant ?",
        answer:
          "Dans /playbooks, ouvrez l'Extracteur Automatique, collez vos clauses approuvées (ou chargez l'exemple) ou importez un .docx/.pdf signé pour générer positions standard/repli et vecteurs 1536-d.",
        category: "playbook",
        keywords: ["extracteur", "golden msa", "docx", "pdf"],
      },
      {
        id: "faq-playbook-extractor-rbac",
        question:
          "Qui peut lancer l'extraction avec sauvegarde automatique vs Mode Aperçu ?",
        answer:
          "ADMIN, LEGAL_COUNSEL et TECHNICAL_LEAD peuvent exécuter le Mode Aperçu (auto_save=false). L'enregistrement direct en base (auto_save=true) est réservé à ADMIN ; VIEWER reçoit 403 Forbidden.",
        category: "playbook",
        keywords: ["rbac", "admin", "apercu", "403"],
      },
      {
        id: "faq-semantic-cache-freshness",
        question:
          "Changer de posture ou modifier le Playbook risque-t-il de renvoyer un cache obsolète ?",
        answer:
          "Jamais. L'empreinte SHA-256 intègre organisation, texte normalisé, titre, posture active, règles Playbook et modèle LLM actif. Toute modification recalcule une nouvelle clé.",
        category: "workflow",
        keywords: ["cache", "sha-256", "posture"],
      },
      {
        id: "faq-telemetry-purge-cache",
        question:
          "Qui peut consulter la Télémétrie FinOps et purger le Cache Sémantique ?",
        answer:
          "Tous les rôles authentifiés (y compris VIEWER) peuvent lire la télémétrie en direct ; purger le cache via 'Purger le Cache Sémantique' exige le rôle ADMIN, LEGAL_COUNSEL ou TECHNICAL_LEAD.",
        category: "workflow",
        keywords: ["telemetrie", "purger", "finops", "rbac"],
      },
    ],
  },
  ar: {
    modules: [
      {
        id: "quick-start",
        number: 1,
        title: "البداية السريعة: دورة مراجعة العقود في 4 خطوات",
        badge: "الخطوات الأولى",
        summary:
          "انتقل من مسودة عقد أو كراسة شروط إلى ملف Microsoft Word مراجَع بالكامل ومتوافق مع سياسات الشركة في أربع خطوات منظمة.",
        keywords: [
          "بداية سريعة",
          "دورة العمل",
          "4 خطوات",
          "رفع",
          "تحليل",
          "تصدير",
        ],
        steps: [
          {
            title: "الخطوة 1: مراجعة أو إعداد سياسات Playbook (/playbooks)",
            description:
              "قبل تدقيق أي اتفاقية، راجع معايير التفاوض الخاصة بشركتك في مدير السياسات. كل قاعدة تحفظ الموقف القياسي، والموقف البديل، والعبارات المرفوضة.",
            tip: "تأتي مساحة العمل مجهزة مسبقاً بـ 5 سياسات قانونية (تحديد المسؤولية، التعويض، SLA، خصوصية البيانات والذكاء الاصطناعي، القانون الحاكم).",
          },
          {
            title: "الخطوة 2: رفع العقد أو كراسة الشروط في لوحة التحكم (/)",
            description:
              "اسحب وأفلت ملف .docx أو .pdf (حتى 25 ميجابايت) في منطقة الرفع. يستخلص المحلل الهيكلي كل بند مع الحفاظ على الترقيم القانوني (مثل 1.1 والمادة الرابعة).",
          },
          {
            title: "الخطوة 3: اضغط «تحليل العقد» داخل الاستوديو",
            description:
              "في استوديو الشاشتين، انقر على «تحليل العقد». يطابق البحث المتجهي + اللفظي الهجين كل بند مع Playbook ويبث التوصيات فورياً عبر SSE.",
          },
          {
            title: "الخطوة 4: معاينة الفروقات والاعتماد والتصدير إلى Word (.docx)",
            description:
              "مرّر المؤشر على «تطبيق التعديل» لمعاينة الكلمات المحذوفة والمضافة مباشرة داخل العقد، ثم اقبل أو عدّل أو ارفض وصدّر ملف تتبع التعديلات أو نسخة نهائية نظيفة.",
          },
        ],
      },
      {
        id: "uploading-contracts",
        number: 2,
        title: "استيعاب عقود Word و PDF وكراسات الشروط",
        badge: "الاستيعاب الهيكلي",
        summary:
          "يستخرج النظام البنود الهرمية بدقة من ملفات .docx و .pdf مع تعقيم XML وحماية المسارات وتنظيف الرؤوس والتذييلات المتكررة.",
        keywords: ["رفع", "docx", "pdf", "تجزئة", "ترقيم", "رفع سريع"],
        steps: [
          {
            title: "الحفاظ على الترقيم والتسلسل القانوني",
            description:
              "يضبط المحلل حدود البنود والفقرات الفرعية (1.1، القسم ب، المادة السادسة) لمنع خلط التزامات متعددة في بطاقة واحدة.",
          },
          {
            title: "تنظيف الرؤوس والأمان الهيكلي لـ OpenXML",
            description:
              "يتحقق من البصمات السحرية للملفات، ويصد هجمات Zip-Slip و XXE، ويزيل أرقام الصفحات المتكررة من عقود PDF طويلة الصفحات.",
          },
          {
            title: "الرفع السريع من داخل الاستوديو (+ رفع)",
            description:
              "يمكنك رفع نسخة محدثة من العقد مباشرة من الشريط العلوي دون العودة إلى لوحة التحكم.",
            tip: "تعتمد أسماء البنود التلقائية على عناوين الأقسام لسهولة المسح عبر خريطة المخاطر الجانبية.",
          },
        ],
      },
      {
        id: "writing-playbook-rules",
        number: 3,
        title: "صياغة قواعد Playbook عالية الدقة (/playbooks)",
        badge: "محرك السياسات",
        summary:
          "تدرّب على كتابة مواقف قياسية، وحدود تنازل معتمدة، وعبارات تصعيد تتكامل مع البحث الهجين 1536-d.",
        keywords: ["playbook", "سياسات", "متجهات", "bm25", "محفزات"],
        steps: [
          {
            title: "كيف يعمل الاسترجاع الهجين (متجهي + لفظي BM25)",
            description:
              "يجمع المحرك وزن 0.7 للتشابه المتجهي 1536-d ووزن 0.3 للتطابق اللفظي والجذور القانونية لاسترجاع أفضل 3 قواعد حاكمة في أقل من 150ms.",
          },
          {
            title: "الفئة والموقف القياسي",
            description:
              "صِغ صياغة مرجعية واضحة وقابلة للتطبيق المباشر في العقود بدلاً من الملاحظات المقتضبة.",
          },
          {
            title: "الموقف البديل وعبارات الخطر المرفوضة",
            description:
              "حدد بوضوح حد التنازل المعتمد مسبقاً والعبارات الحاسمة مثل «مسؤولية غير محدودة» أو «تدريب نماذج AI عامة».",
          },
        ],
      },
      {
        id: "mastering-studio",
        number: 4,
        title: "إتقان مساحة العمل المنقسمة (/documents/[id])",
        badge: "تدفق العمل الرئيسي",
        summary:
          "استخدم المزامنة ثنائية الاتجاه، ومعاينة الفروقات كلمة بكلمة، ونقاط التفاوض لإتمام المراجعة القانونية بسرعة فائقة.",
        keywords: ["شاشة منقسمة", "فروقات", "نقطة تفاوض", "تطبيق", "تعديل"],
        steps: [
          {
            title: "المزامنة الثنائية بين المحرر والفاحص",
            description:
              "النقر على أي بند في الوثيقة يبرز بطاقته في الفاحص الأيسر تلقائياً، والنقر على البطاقة يقفز بالمحرر إلى البند المقابل.",
          },
          {
            title: "معاينة الفروقات الحية عند التمرير",
            description:
              "مرّر على زر «تطبيق التعديل» لرؤية النص المحذوف باللون الأحمر المشطوب والنص الجديد بالأخضر قبل اعتماد التغيير.",
          },
          {
            title: "حسم البند ونقطة التفاوض المرفقة",
            description:
              "استخدم أزرار تطبيق التعديل أو تعديل يدوي أو رفض، وانسخ «نقطة التفاوض المقترحة» لإرسالها إلى مستشار الطرف الآخر.",
          },
        ],
      },
      {
        id: "collaboration-concurrency-audit",
        number: 5,
        title: "التعاون الفريقي، أقفال التزامن وسجل التدقيق",
        badge: "الحوكمة والامتثال",
        summary:
          "ناقش البنود عبر تعليقات مترابطة، وامنع تضارب التعديلات عبر أقفال الإصدارات التفاؤلية، وتتبّع كل إجراء في سجل ثابت.",
        keywords: ["تعليقات", "تعارض 409", "تزامن", "سجل تدقيق"],
        steps: [
          {
            title: "سلاسل تعليقات مطوية لكل بند",
            description:
              "أضف ملاحظات المحامين والمراجعين مباشرة على البند النشط في أسفل لوحة الفحص.",
          },
          {
            title: "حماية التزامن التفاؤلية (v1 -> v2)",
            description:
              "إذا عدّل زميلٌ نفس البند قبلك، يرفض الخادم الطلب القديم برمز HTTP 409 Conflict ويعيد مزامنة حالة الواجهة بأمان.",
          },
          {
            title: "سجل التدقيق غير القابل للتعديل",
            description:
              "يسجل كل حدث (تحليل، تطبيق، تحسين بالمساعد الذكي، محاكاة اعتراض، تصدير) مع هوية الفاعل والتفاصيل الكاملة.",
          },
        ],
      },
      {
        id: "exporting-word-docx",
        number: 6,
        title: "التصدير إلى Microsoft Word (تتبع التغييرات vs نسخة نهائية)",
        badge: "تصدير OpenXML",
        summary:
          "صدّر ملفات .docx أصلية تدعم وسوم المراجعة <w:ins> و<w:del> وتعليقات الهوامش في Word و Google Docs.",
        keywords: ["تصدير", "word", "تتبع التغييرات", "نسخة نهائية", "openxml"],
        steps: [
          {
            title: "تصدير تتبع التعديلات (.docx) للتفاوض",
            description:
              "ينتج وسوم OpenXML قياسية تعرض الحذف والإضافة والتعليقات الجانبية لمشاركتها مع الطرف الآخر.",
          },
          {
            title: "تصدير نسخة نهائية نظيفة (.docx) للتوقيع",
            description:
              "ينتج وثيقة نظيفة تعتمد النص المحدّث لكل بند جاهزة للاعتماد والتوقيع الإلكتروني.",
          },
        ],
      },
      {
        id: "ai-engine-switcher",
        number: 7,
        title: "تبديل مزودي ونماذج الذكاء الاصطناعي الحية والخزنة المشفرة",
        badge: "تبديل مباشر + أمان",
        summary:
          "اربط المحرك بـ Gemini أو OpenAI أو Groq أو Anthropic أو Ollama/vLLM عبر البحث المباشر (/models) واحفظ المفاتيح في خزنة مشفرة.",
        keywords: ["نماذج", "gemini", "openai", "ollama", "خزنة", "rsvault"],
        steps: [
          {
            title: "افتح إعدادات محرك AI من الترويسة",
            description:
              "اختر مزود الاستدلال LLM ومزود التضمين المتجهي (Vector Embeddings) بشكل مستقل مع تطبيع 1536-d تلقائياً.",
          },
          {
            title: "جلب النماذج الحية واختبار الاتصال",
            description:
              "استدعِ قائمة النماذج الحية من واجهة المزود أو أدخل Model ID يدوياً ثم شغّل «اختبار الاتصال» لقياس الكمون قبل الحفظ.",
          },
          {
            title: "النسخ الاحتياطي عبر الخزنة المشفرة (.rsvault.json)",
            description:
              "صدّر واستعد إعداداتك ومفاتيح API دون اتصال عبر تشفير AES-256-GCM المشتق بـ PBKDF2.",
          },
        ],
      },
      {
        id: "negotiation-stance-selector",
        number: 8,
        title: "محدد استراتيجية التفاوض بالذكاء الاصطناعي (صارم / متوازن / تجاري)",
        badge: "الميزة الذكية #1",
        summary:
          "غيّر حدة الصياغة التلقائية بين الحماية القصوى الصارمة والتوازن الثنائي أو الإغلاق التجاري السريع.",
        keywords: ["استراتيجية", "صارم", "متوازن", "تجاري"],
        steps: [
          {
            title: "صارم: التزام مطلق بالسياسة الأساسية",
            description:
              "يرفض أي تسوية ويتمسك بأشد سقوف الحماية والضمانات في Playbook الشركة.",
          },
          {
            title: "متوازن: التزامات ثنائية متبادلة (الافتراضية)",
            description:
              "يحوّل الشروط الأحادية إلى التزامات متكافئة وعادلة وفق معايير السوق المؤسسية.",
          },
          {
            title: "تجاري: تسريع الإغلاق عبر المواقف البديلة",
            description:
              "يستخدم حدود التنازل المعتمدة مسبقاً (مثل 2× الرسوم السنوية) لإنهاء التفاوض بسرعة.",
          },
        ],
      },
      {
        id: "inline-clause-ai-copilot",
        number: 9,
        title: "المساعد الذكي لكل بند والتوجيه الحر",
        badge: "الميزة الذكية #2",
        summary:
          "أعد صياغة أي مقترح في لحظات عبر تعليمات نصية أو شرائح أوامر سريعة مع تحديث فوري لنقطة التفاوض.",
        keywords: ["مساعد ذكي", "توجيه", "صياغة", "تعديل"],
        steps: [
          {
            title: "شغّل «✨ المساعد الذكي» داخل أي بطاقة",
            description:
              "اختر أمراً جاهزاً (متبادل، سقف 100 ألف دولار، مهلة 30 يوماً) أو اكتب توجيهاً مخصصاً.",
          },
          {
            title: "تحديث النص والنقطة وسجل التدقيق معاً",
            description:
              "يمرر النظام النص الناتج مباشرة عبر حارس الدقة Critic Guard ويوثّق حدث SUGGESTION_REFINED.",
          },
        ],
      },
      {
        id: "cross-clause-radar",
        number: 10,
        title: "رادار التناقضات، الإحالات المعطلة والمصطلحات غير المعرّفة",
        badge: "الميزة الذكية #3",
        summary:
          "افحص العقد بالكامل كرسم بياني مترابط لاكتشاف تعارض السقوف ومواعيد السداد والإحالات المفقودة.",
        keywords: ["رادار", "تناقض", "إحالات", "درجة السلامة"],
        steps: [
          {
            title: "تشغيل «فحص الاتساق عبر البنود»",
            description:
              "يحسب مؤشر السلامة من 100 ويصنّف النتائج إلى تناقضات، إحالات معطلة، ومصطلحات غير معرّفة.",
          },
          {
            title: "قفزة ثنائية الاتجاه للبنود المتعارضة",
            description:
              "انقر زر «المصدر» أو «يتعارض مع» للانتقال المباشر بين البندين وحل التضارب قبل التوقيع.",
          },
        ],
      },
      {
        id: "critic-verifier-guard",
        number: 11,
        title: "حلقة التحقق المتعددة الوكلاء وحارس الدقة ضد الهلوسة",
        badge: "الميزة الذكية #4",
        summary:
          "يمر كل تعديل بمراجعة وكيل فاحص مستقل عبر 3 بوابات أمان: الالتزام بالسياسة، منع الهلوسة، وحفظ الأرقام والترقيم.",
        keywords: ["حارس الدقة", "هلوسة", "ترقيم", "ثقة"],
        steps: [
          {
            title: "خط أنابيب ثنائي الوكلاء (المصيغ -> حارس الدقة)",
            description:
              "يكتشف تلقائياً أي عبارات محظورة أو نصوص نائب متبقية ([TBD]) أو إسقاط أرقام أقسام ويصححها (AUTO_REFINED).",
          },
          {
            title: "إعادة الفحص الفوري عند الطلب",
            description:
              "استخدم زر «إعادة الفحص بالحارس» لإعادة تقييم البند وتسجيل SUGGESTION_VERIFIED.",
          },
        ],
      },
      {
        id: "counterparty-pushback-simulator",
        number: 12,
        title: "محاكي اعتراضات الطرف الآخر واستراتيجية الجولة الثانية",
        badge: "الميزة الذكية #5",
        summary:
          "تنبأ برد محامي الطرف الآخر، واحصل على احتمال القبول، ونص الرد المجهز، وصياغة التسوية الاحتياطية بنقرة واحدة.",
        keywords: ["محاكاة", "اعتراض", "جولة ثانية", "تسوية"],
        steps: [
          {
            title: "تشغيل المحاكاة التفاوضية",
            description:
              "انقر «🎯 محاكاة اعتراض الطرف الآخر» للحصول على تقدير القبول 0–100% ومستوى الاعتراض.",
          },
          {
            title: "نسخ نص الرد واعتماد صياغة التسوية",
            description:
              "انسخ نص الرد جاهزاً للمراسلات أو اضغط «استخدام صياغة التسوية» لتحديث التعديل المقترح فوراً.",
          },
        ],
      },
      {
        id: "ai-playbook-extractor",
        number: 13,
        title: "المستخرج الذكي لقواعد Playbook من العقود القياسية",
        badge: "الميزة الذكية #6",
        summary:
          "حوّل أي عقد MSA معتمد أو ملف .docx/.pdf إلى قواعد Playbook مفهرسة بالمتجهات 1536-d في ثوانٍ.",
        keywords: ["مستخرج", "عقد قياسي", "قواعد", "معاينة"],
        steps: [
          {
            title: "لصق البنود المعتمدة أو رفع ملف .docx/.pdf",
            description:
              "استخدم الزر النموذجي للتجربة الفورية أو ارفع وثيقة مرجعية حقيقية للشركة.",
          },
          {
            title: "وضع الحفظ التلقائي أو وضع المعاينة الآمن",
            description:
              "يمكن للمدير حفظ القواعد وفهرستها مباشرة، كما يمكن للمستشار القانوني مراجعتها في وضع المعاينة أولاً.",
          },
        ],
      },
      {
        id: "ai-semantic-cache-telemetry",
        number: 14,
        title: "الذاكرة الدلالية SHA-256 ولوحة قياسات FinOps المباشرة",
        badge: "الميزة الذكية #7",
        summary:
          "تجنّب تكرار التكلفة والكمون على البنود غير المعدلة عبر ذاكرة SHA-256 فائقة السرعة (<1ms) وتتبع التوفير لحظياً.",
        keywords: ["ذاكرة دلالية", "sha-256", "finops", "قياسات", "تفريغ"],
        steps: [
          {
            title: "إصابة ذاكرة دلالية (<1ms) عند إعادة التدقيق",
            description:
              "تستجيب البنود غير المتغيرة فوراً من الذاكرة مع الحفاظ التام على عزل المستأجرين ونوع النموذج والاستراتيجية.",
          },
          {
            title: "مراقبة التوفير المالي وتفريغ الذاكرة",
            description:
              "راجع «⚡ قياسات AI» لمراقبة نسبة الإصابة وتوفير التكلفة بالدولار وتفريغ الذاكرة يدوياً للأدوار المصرح لها.",
          },
        ],
      },
    ],
    heatmapLegend: [
      {
        level: "CRITICAL",
        localizedLevel: "حرج",
        colorName: "قرمزي",
        badgeClass:
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
        dotClass: "bg-rose-500 border-rose-600/30 dark:border-rose-400",
        meaning:
          "مخالفة جسيمة للسياسة أو تعرض مالي/قانوني غير محدود (مثل مسؤولية غير مقيدة أو تدريب نماذج AI عامة على بيانات العميل).",
        recommendedAction:
          "يتطلب تعديلاً فورياً عبر «تطبيق التعديل» أو «تعديل يدوي» قبل أي اعتماد.",
      },
      {
        level: "HIGH",
        localizedLevel: "مرتفع",
        colorName: "كهرماني",
        badgeClass:
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
        dotClass: "bg-amber-500 border-amber-600/30 dark:border-amber-400",
        meaning:
          "انحراف جوهري عن الموقف القياسي للشركة (مثل تعويض أحادي الجانب أو غياب أرصدة SLA).",
        recommendedAction:
          "طبّق صياغة Playbook القياسية أو تفاوض ضمن حدود الموقف البديل المعتمد.",
      },
      {
        level: "MEDIUM / LOW",
        localizedLevel: "متوسط / منخفض",
        colorName: "أزرق سماوي",
        badgeClass:
          "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
        dotClass:
          "bg-sky-500 border-sky-600/30 dark:bg-sky-400 dark:border-sky-300",
        meaning:
          "تفاوت تجاري طفيف أو صياغة عامة يُستحسن توضيحها حمايةً للالتزامات.",
        recommendedAction:
          "راجع مبرر الذكاء الاصطناعي وأضف توضيحاً أو تعليقاً للفريق حسب الحاجة.",
      },
      {
        level: "COMPLIANT",
        localizedLevel: "متوافق",
        colorName: "زمردي",
        badgeClass:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
        dotClass: "bg-emerald-500 border-emerald-600/30 dark:border-emerald-400",
        meaning:
          "البند متوافق تماماً مع سياسات الشركة ولا يحتوي على أي عبارات مرفوضة، أو تم اعتماده/تعديله بنجاح.",
        recommendedAction: "لا يلزم إجراء إضافي؛ البند جاهز للتصدير النهائي.",
      },
    ],
    templates: [
      {
        id: "tpl-lol",
        title: "تحديد المسؤولية التعاقدية المتبادل واستبعاد الأضرار التبعية",
        category: "تحديد المسؤولية التعاقدية",
        standard_position:
          "باستثناء خروقات السرية وتعويضات الملكية الفكرية، لا تتجاوز المسؤولية التراكمية الإجمالية لأي طرف إجمالي الرسوم المدفوعة أو المستحقة عن الاثني عشر (12) شهراً السابقة للمطالبة، مع إعفاء متبادل من الأضرار غير المباشرة والتبعية.",
        fallback_position:
          "سقف أعلى متبادل يعادل ضعف (2×) الرسوم السنوية لمطالبات حماية البيانات والملكية الفكرية.",
        unacceptable_triggers:
          "سقف 500$، مسؤولية المورد لا تتجاوز رسوم شهر واحد، تحميل العميل مسؤولية غير محدودة",
        why_it_works:
          "يمنع السقوف الأحادية الضئيلة مع إبقاء بند الاستثناءات المتبادل واضحاً ودقيقاً.",
      },
      {
        id: "tpl-ai-privacy",
        title: "خصوصية البيانات وحظر تدريب نماذج الذكاء الاصطناعي العامة",
        category: "خصوصية البيانات وحوكمة الذكاء الاصطناعي",
        standard_position:
          "يحتفظ العميل بملكية جميع بياناته، ويلتزم المورد بمعايير RGPD/GDPR و CCPA مع حظر تام لاستخدام بيانات العميل لتدريب نماذج الذكاء الاصطناعي العامة أو المشتركة، والإخطار بأي خرق مؤكد خلال 24 ساعة.",
        fallback_position:
          "السماح ببيانات قياس مجمّعة ومجهّلة بشكل لا رجعة فيه لأغراض المراقبة الأمنية واستقرار الخدمة فقط.",
        unacceptable_triggers:
          "ترخيص دائم وغير قابل للإلغاء لتدريب نماذج الذكاء الاصطناعي، مشاركة البيانات لتدريب نماذج عامة",
        why_it_works:
          "يغلق ثغرات تدريب نماذج AI العامة مع إتاحة مرونة أمنية وتشغيلية واضحة للمورّد.",
      },
      {
        id: "tpl-sla",
        title: "اتفاقية مستوى الخدمة المؤسسية (SLA) وأرصدة الخدمة",
        category: "اتفاقية مستوى الخدمة (SLA)",
        standard_position:
          "يضمن المورد توافراً شهرياً لا يقل عن 99.9% في بيئة الإنتاج (باستثناء الصيانة المجدولة بإشعار مسبق)، مع أرصدة خدمة متدرجة تصل إلى 25% وحق الإنهاء عند الإخلال المتكرر.",
        fallback_position:
          "99.9% توافر شهري مع أرصدة متدرجة حتى 15% وحق الإنهاء بعد أربعة (4) أشهر متتالية دون 99.5%.",
        unacceptable_triggers:
          "توافر بأقصى جهد معقول فقط، أرصدة وفق التقدير المطلق للمورّد، دون حد أدنى مضمون للتشغيل",
        why_it_works:
          "يربط بين نسبة التشغيل التعاقدية والعقوبات المالية المحددة وحق الخروج الواضح.",
      },
    ],
    exportComparison: [
      {
        feature: "وسوم المراجعة في Word (<w:ins> / <w:del>)",
        trackChanges: "مضمّنة بالكامل بألوان المراجعة في Microsoft Word",
        cleanCopy: "محذوفة — ينتج وثيقة نصية نهائية نظيفة دون علامات",
      },
      {
        feature: "التعليقات القانونية المضمنة",
        trackChanges: "تُرفق كتعليقات هامشية مع التواريخ والمبررات",
        cleanCopy: "تُزال بالكامل لإصدار نسخة التوقيع النهائي",
      },
      {
        feature: "أفضل استخدام عملي",
        trackChanges: "إرسال مسودة المراجعة إلى محامي الطرف الآخر للتفاوض",
        cleanCopy: "التنفيذ النهائي والتوقيع بعد إغلاق جميع البنود",
      },
      {
        feature: "صحة البنية والتنسيق المفتوح OpenXML",
        trackChanges: "أرشيف .docx متوافق 100% مع Word و Google Docs",
        cleanCopy: "أرشيف .docx متوافق 100% مع Word و Google Docs",
      },
    ],
    faqs: [
      {
        id: "faq-offline-demo",
        question:
          "ما الفرق بين «متصل بالخادم» و«وضع العرض التجريبي (أوفلاين)»؟",
        answer:
          "عند توفر خادم FastAPI تعرض الشارة العلوية «متصل بالخادم» وتُنشئ جلسة مؤسسية موثقة. وإذا تعذر الوصول إلى الخادم يتحول التطبيق بسلاسة إلى الوضع التجريبي المحلي لتجربة الرفع والسياسات والتدقيق دون انقطاع.",
        category: "workflow",
        keywords: ["عرض تجريبي", "أوفلاين", "خادم", "اتصال"],
      },
      {
        id: "faq-inline-diff",
        question:
          "كيف أعاين الفروقات كلمة بكلمة قبل اعتماد التعديل المقترح؟",
        answer:
          "في لوحة الفاحص بالذكاء الاصطناعي، مرّر مؤشر الفأرة على زر «تطبيق التعديل» في أي بطاقة. ستظهر فوراً الكلمات المحذوفة بالأحمر المشطوب والإضافات بالأخضر داخل نص العقد.",
        category: "workflow",
        keywords: ["معاينة", "فروقات", "تطبيق التعديل"],
      },
      {
        id: "faq-conflict-409",
        question:
          "ماذا يحدث إذا قام مراجعان بتعديل نفس البند في وقت واحد؟",
        answer:
          "كل بند محمي بقفل تزامن تفاؤلي (v1، v2...). إذا حفظ زميل تعديلاً قبلك، يرفض الخادم الطلب المتأخر برمز HTTP 409 Conflict ويعيد الواجهة بأمان مع تنبيه واضح.",
        category: "collaboration",
        keywords: ["409", "تعارض", "تزامن", "إصدار"],
      },
      {
        id: "faq-custom-playbook",
        question:
          "هل تسري قواعد Playbook الجديدة فوراً على تحليل العقود؟",
        answer:
          "نعم. فور إضافة قاعدة في /playbooks، يولد الخادم متجههاً بـ 1536 بُعداً ويفهرس كلماتها المفتاحية ليُقيَّم العقد في التحليل التالي مباشرة وفق سياستك المحدثة.",
        category: "playbook",
        keywords: ["playbook", "قواعد", "متجهات", "فوري"],
      },
      {
        id: "faq-word-compatibility",
        question:
          "هل ملف تتبع التعديلات (.docx) المصدّر متوافق تماماً مع Microsoft Word؟",
        answer:
          "نعم. يبني المصدّر أرشيفات OpenXML صالحة تضم وسوم <w:del> و<w:ins> وتعليقات المراجعة المعتمدة، ما يتيح قبولها أو رفضها بسلاسة في Microsoft Word.",
        category: "export",
        keywords: ["word", "docx", "تتبع التغييرات", "توافق"],
      },
      {
        id: "faq-ai-engine-switcher",
        question:
          "كيف أبدّل المزود إلى Gemini أو Groq أو Ollama أو خادم محلي دون إعادة تشغيل؟",
        answer:
          "افتح شارة المحرك من الترويسة، واختر المزود، واجلب النماذج الحية (أو أدخل المعرّف يدوياً)، واختبر الاتصال ثم اضغط «حفظ وتفعيل» للتبديل الفوري.",
        category: "workflow",
        keywords: ["نماذج", "gemini", "groq", "ollama", "مباشر"],
      },
      {
        id: "faq-ai-config-vault",
        question:
          "كيف تعمل الخزنة المشفرة (.rsvault.json) وهل تغادر مفاتيحي الخادم؟",
        answer:
          "تُحفظ المفاتيح في الذاكرة التشغيلية الآمنة فقط، وتُشفّر ملفات .rsvault.json بخوارزمية AES-256-GCM ومفتاح مشتق بـ 600,000 دورة PBKDF2 للاستعادة الآمنة محلياً.",
        category: "workflow",
        keywords: ["خزنة", "rsvault", "aes-256", "تشفير"],
      },
      {
        id: "faq-negotiation-stance",
        question:
          "ما الفرق بين استراتيجيات «صارم» و«متوازن» و«تجاري»؟",
        answer:
          "الوضع الصارم يتمسك حرفياً بالسياسة الأساسية دون تنازلات؛ المتوازن يوازن الحقوق والالتزامات بشكل متبادل؛ التجاري يعتمد الحدود البديلة لتسريع توقيع الصفقة.",
        category: "workflow",
        keywords: ["استراتيجية", "صارم", "متوازن", "تجاري"],
      },
      {
        id: "faq-when-to-use-commercial",
        question: "متى يُنصح باختيار الوضع «تجاري / إغلاق سريع»؟",
        answer:
          "عند التفاوض نهاية الربع المالي مع موردين استراتيجيين موثوقين حيث يكون التنازل المسبق (مثل سقف 2× الرسوم) مقبولاً ومعتمداً لتفادي جولات التفاوض الطويلة.",
        category: "workflow",
        keywords: ["تجاري", "إغلاق سريع", "بديل"],
      },
      {
        id: "faq-inline-clause-copilot",
        question:
          "كيف يختلف «المساعد الذكي لكل بند» عن التحرير اليدوي الكامل؟",
        answer:
          "المساعد الذكي يعيد صياغة النص والمنطق القانوني ونقطة التفاوض معاً عبر أوامر طبيعية مع فحصها تلقائياً بحارس الدقة للحفاظ على الترقيم القانوني.",
        category: "workflow",
        keywords: ["مساعد ذكي", "توجيه", "صياغة"],
      },
      {
        id: "faq-copilot-audit-trail",
        question: "هل تُوثَّق تعديلات المساعد الذكي في سجل التدقيق والامتثال؟",
        answer:
          "نعم. تُسجَّل كل عملية في سجل التدقيق الدائم بنوع الحدث SUGGESTION_REFINED مع التوجيه المستخدم ومعرّف المراجع.",
        category: "collaboration",
        keywords: ["سجل التدقيق", "امتثال", "مساعد ذكي"],
      },
      {
        id: "faq-cross-clause-radar",
        question:
          "ما أنواع العيوب الهيكلية التي يلتقطها «رادار التناقضات عبر البنود»؟",
        answer:
          "يرصد التناقضات المنطقية والمالية بين البنود (مثل تعارض سقوف المسؤولية أو شروط الدفع Net 7 مقابل Net 30)، وإحالات الأقسام غير الموجودة، والمصطلحات المعرّفة الناقصة.",
        category: "workflow",
        keywords: ["رادار", "تناقضات", "إحالات", "مصطلحات"],
      },
      {
        id: "faq-integrity-score-calculation",
        question: "كيف تُحتسب «درجة السلامة الهيكلية» (0–100%)؟",
        answer:
          "تبدأ النتيجة من 100% وتُخصم نقاط مرجحة حسب درجة خطورة كل عيب هيكلي مكتشف (حرج، مرتفع، متوسط) عبر كامل وثيقة العقد.",
        category: "workflow",
        keywords: ["درجة السلامة", "رادار", "حساب"],
      },
      {
        id: "faq-critic-verifier-loop",
        question:
          "ماذا يضيف «حارس الدقة» (Critic Guard) بعد توليد التعديلات المقترحة؟",
        answer:
          "يفحص وكيل التحقق الثاني كل صياغة للتأكد من خلوها من الهلوسة أو الرموز الوهمية ([TBD]) وعدم تسرب العبارات الممنوعة وتوافق الأرقام مع النص الأصلي.",
        category: "workflow",
        keywords: ["حارس الدقة", "هلوسة", "تحقق"],
      },
      {
        id: "faq-critic-verification-gates",
        question:
          "ما الفارق بين شارات «موثّق» و«مُحسَّن تلقائياً» و«يحتاج مراجعة»؟",
        answer:
          "«موثّق» يعني اجتياز البوابات الثلاث مباشرة؛ «مُحسَّن تلقائياً» يعني إصلاح خلل طفيف تلقائياً؛ «يحتاج مراجعة» يشير إلى تباين يتطلب نظرة المستشار القانوني.",
        category: "workflow",
        keywords: ["شارات", "موثق", "محسن تلقائيا"],
      },
      {
        id: "faq-pushback-simulator",
        question:
          "كيف يعمل «محاكي اعتراضات الطرف الآخر» قبل إرسال الردود؟",
        answer:
          "يتقمص شخصية محامي الطرف الآخر، ويقدّر احتمال القبول ودرجة الرفض المتوقعة، ويقترح نص الرد القانوني المناسب للجولة الثانية مع بديل تسوية وسط.",
        category: "workflow",
        keywords: ["محاكاة", "اعتراض", "رد", "تفاوض"],
      },
      {
        id: "faq-pushback-compromise",
        question:
          "هل يؤدي «استخدام صياغة التسوية» إلى استبدال نص البند الأصلي في Word فوراً؟",
        answer:
          "لا. بل يحدّث الصياغة البديلة المقترحة داخل بطاقة التعديل فقط، ويمكنك معاينة الفرق ثم الضغط على «تطبيق التعديل» عند جاهزيتك.",
        category: "workflow",
        keywords: ["تسوية", "تعديل", "تطبيق التعديل"],
      },
      {
        id: "faq-playbook-auto-extractor",
        question:
          "كيف أولّد قواعد Playbook تلقائياً من عقد قياسي موقع مسبقاً؟",
        answer:
          "في صفحة /playbooks، الصق بنود عقد MSA قياسي أو ارفع ملف .docx/.pdf ليقوم المستخرج الذكي باستنتاج القواعد والمحفزات وفهرستها في متجهات 1536-d.",
        category: "playbook",
        keywords: ["مستخرج", "عقد قياسي", "docx", "pdf"],
      },
      {
        id: "faq-playbook-extractor-rbac",
        question:
          "من يملك صلاحية الحفظ التلقائي مقابل وضع المعاينة في مستخرج السياسات؟",
        answer:
          "يمكن لأدوار ADMIN و LEGAL_COUNSEL و TECHNICAL_LEAD تشغيل وضع المعاينة الآمن، بينما يقتصر الحفظ التلقائي المباشر في القاعدة على دور ADMIN (ويُحظر التعديل على VIEWER).",
        category: "playbook",
        keywords: ["صلاحيات", "rbac", "admin", "معاينة"],
      },
      {
        id: "faq-semantic-cache-freshness",
        question:
          "هل يؤدي تغيير الاستراتيجية أو تحديث Playbook إلى قراءة نتائج قديمة من الذاكرة؟",
        answer:
          "أبداً. تتضمن بصمة SHA-256 المعرّفة: المؤسسة، نص البند، العنوان، الاستراتيجية النشطة، بصمة Playbook، والنموذج النشط؛ وأي تغيير يفرض تدقيقاً طازجاً تلقائياً.",
        category: "workflow",
        keywords: ["ذاكرة دلالية", "sha-256", "حداثة", "استراتيجية"],
      },
      {
        id: "faq-telemetry-purge-cache",
        question: "من يمكنه عرض قياسات FinOps أو تفريغ الذاكرة الدلالية؟",
        answer:
          "يمكن لجميع المستخدمين المصادق عليهم عرض القياسات وتفاصيل التكلفة، بينما يتطلب زر «تفريغ الذاكرة الدلالية» صلاحية ADMIN أو LEGAL_COUNSEL أو TECHNICAL_LEAD.",
        category: "workflow",
        keywords: ["قياسات", "تفريغ", "finops", "صلاحيات"],
      },
    ],
  },
};

