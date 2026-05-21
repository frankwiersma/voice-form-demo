export type Lang = "nl" | "en"

export const LANG_STORAGE_KEY = "vfd_lang"

/** App-level UI strings. */
export const UI: Record<Lang, {
  appTitle: string
  tagline: string
  headingSuffix: string
  heroBody: string
  figureCaption: string
  figureAlt: string
  voiceDictation: string
  voiceFill: string
  processing: string
  stopFill: string
  submit: string
  clearForm: string
  settings: string
  toggleTheme: string
}> = {
  nl: {
    appTitle: "Offshore Onderstation-inspectie",
    tagline: "Offshore net · veldwerkzaamheden",
    headingSuffix: ", met je stem.",
    heroBody:
      "Loop over het platform, spreek je waarnemingen in en laat AI er een volledig routine-inspectierapport van maken — schakelinstallatie, lekkages, veiligheidsuitrusting, beveiliging en meer. Maak een foto en AI markeert automatisch afwijkingen.",
    figureCaption: "Offshore hoogspanningsonderstation — doorsnede",
    figureAlt: "Doorsnede van een TenneT offshore hoogspanningsonderstation",
    voiceDictation: "AI-ondersteunde spraakinvoer",
    voiceFill: "Spraak invullen",
    processing: "Bezig…",
    stopFill: "Stop & vul formulier",
    submit: "Inspectierapport indienen",
    clearForm: "Formulier wissen",
    settings: "Instellingen",
    toggleTheme: "Thema wisselen",
  },
  en: {
    appTitle: "Offshore Substation Inspection",
    tagline: "Offshore grid · field operations",
    headingSuffix: ", by voice.",
    heroBody:
      "Walk the platform, speak your observations, and let AI structure them into a complete routine inspection report — switchgear, leaks, safety equipment, security and more. Snap a photo and AI flags anomalies automatically.",
    figureCaption: "Offshore high-voltage substation — cutaway view",
    figureAlt: "Cutaway of a TenneT offshore high-voltage substation platform",
    voiceDictation: "AI-assisted voice dictation",
    voiceFill: "Voice fill",
    processing: "Processing…",
    stopFill: "Stop & fill form",
    submit: "Submit Inspection Report",
    clearForm: "Clear form",
    settings: "Settings",
    toggleTheme: "Toggle theme",
  },
}

/** Section group titles, keyed by the canonical English title used in page groups. */
export const GROUP_I18N: Record<string, Record<Lang, string>> = {
  Identification: { nl: "Identificatie", en: "Identification" },
  "General & equipment condition": { nl: "Algemene & technische toestand", en: "General & equipment condition" },
  "Safety & security": { nl: "Veiligheid & beveiliging", en: "Safety & security" },
  "Photo inspection": { nl: "Foto-inspectie", en: "Photo inspection" },
  "Actions & sign-off": { nl: "Acties & ondertekening", en: "Actions & sign-off" },
}

/** Field labels + placeholders per language, keyed by field name. */
export const FIELD_I18N: Record<string, Record<Lang, { label: string; placeholder: string }>> = {
  inspectorName: {
    nl: { label: "Naam inspecteur *", placeholder: "Jan Jansen" },
    en: { label: "Inspector Name *", placeholder: "John Smith" },
  },
  dateTime: {
    nl: { label: "Datum en tijd *", placeholder: "2025-10-10 14:30" },
    en: { label: "Date and Time *", placeholder: "2025-10-10 14:30" },
  },
  substationName: {
    nl: { label: "Naam/ID onderstation *", placeholder: "Station Alpha-01" },
    en: { label: "Substation Name/ID *", placeholder: "Station Alpha-01" },
  },
  weatherConditions: {
    nl: { label: "Weersomstandigheden", placeholder: "Helder, 12 °C" },
    en: { label: "Weather Conditions", placeholder: "Clear, temperature 72°F" },
  },
  generalImpression: {
    nl: { label: "Algemene visuele indruk", placeholder: "Algehele toestand van de locatie…" },
    en: { label: "General Visual Impression", placeholder: "Overall site condition…" },
  },
  switchgearCondition: {
    nl: { label: "Schakelinstallatie en transformatoren", placeholder: "Toestand van de apparatuur…" },
    en: { label: "Switchgear and Transformers", placeholder: "Condition of equipment…" },
  },
  leaksRustOverheating: {
    nl: { label: "Olielekkage, roest of oververhitting", placeholder: "Waargenomen signalen…" },
    en: { label: "Oil Leaks, Rust, or Overheating", placeholder: "Signs observed…" },
  },
  safetyEquipment: {
    nl: { label: "Veiligheidsuitrusting en signalering", placeholder: "Status van veiligheidsuitrusting…" },
    en: { label: "Safety Equipment and Signage", placeholder: "Status of safety equipment…" },
  },
  cleanlinessVegetation: {
    nl: { label: "Netheid en begroeiing", placeholder: "Status netheid locatie…" },
    en: { label: "Cleanliness and Vegetation Control", placeholder: "Site cleanliness status…" },
  },
  securityStatus: {
    nl: { label: "Beveiligingsstatus", placeholder: "Hekken, sloten, toegangscontrole…" },
    en: { label: "Security Status", placeholder: "Fences, locks, access control…" },
  },
  unusualObservations: {
    nl: { label: "Ongewone geluiden, geuren of trillingen", placeholder: "Afwijkende waarnemingen…" },
    en: { label: "Unusual Noises, Smells, or Vibrations", placeholder: "Any abnormal observations…" },
  },
  imageAnomalyDetection: {
    nl: { label: "Beeldanalyse afwijkingen", placeholder: "Upload inspectiefoto's…" },
    en: { label: "Image Anomaly Detection", placeholder: "Upload inspection photos…" },
  },
  maintenanceActions: {
    nl: { label: "Onderhouds-/correctieve acties", placeholder: "Uitgevoerde acties…" },
    en: { label: "Maintenance/Corrective Actions", placeholder: "Actions performed…" },
  },
  additionalRemarks: {
    nl: { label: "Aanvullende waarnemingen", placeholder: "Overige opmerkingen…" },
    en: { label: "Additional Observations", placeholder: "Other remarks…" },
  },
  recommendations: {
    nl: { label: "Aanbevelingen", placeholder: "Aanbevelingen voor opvolging of reparatie…" },
    en: { label: "Recommendations", placeholder: "Follow-up or repair recommendations…" },
  },
  inspectorSignature: {
    nl: { label: "Handtekening/initialen inspecteur", placeholder: "J.J." },
    en: { label: "Inspector Signature/Initials", placeholder: "J.S." },
  },
}
