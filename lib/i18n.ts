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
  scriptTitle: string
  scriptHint: string
  copy: string
  copied: string
  scriptShort: string
  scriptLong: string
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
    scriptTitle: "Voorbeeldscript",
    scriptHint: "Lees dit hardop voor terwijl je op Spraak invullen drukt — je ziet het formulier live invullen.",
    copy: "Kopiëren",
    copied: "Gekopieerd",
    scriptShort: "Kort",
    scriptLong: "Lang",
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
    scriptTitle: "Example script",
    scriptHint: "Read this aloud while you press Voice fill — you'll see the form populate live.",
    copy: "Copy",
    copied: "Copied",
    scriptShort: "Short",
    scriptLong: "Long",
  },
}

/** Demo dictation scripts to read aloud, per language, in a short and long variant. */
export const EXAMPLE_SCRIPT: Record<Lang, { short: string; long: string }> = {
  nl: {
    short: `Inspecteur Mark de Vries, 21 mei 2025 kwart over twee 's middags, onderstation Borssele Alpha, station BA-02. Weer helder, een graad of veertien. De schakelinstallatie draait normaal, geen alarmen. Bij transformator twee een lichte olievlek en wat beginnende roest. Veiligheidsuitrusting in orde, terrein schoon, beveiliging functioneert. Advies: transformator twee over twee weken opnieuw controleren op lekkage. Getekend, M.d.V.`,
    long: `Goedemiddag, mijn naam is Mark de Vries. Het is vandaag 21 mei 2025, kwart over twee 's middags. Ik voer de routine-inspectie uit op onderstation Borssele Alpha, station BA-02. Het weer is helder, een graad of veertien, met matige wind uit het zuidwesten.

Mijn algemene indruk is goed: het platform ziet er netjes en goed onderhouden uit. De schakelinstallatie en de transformatoren draaien normaal, er zijn geen alarmen en de temperaturen blijven binnen de marges. Wel zie ik bij transformator twee een lichte olievlek op de vloer en wat beginnende roest op de bevestigingsbeugels.

De veiligheidsuitrusting is in orde — de brandblussers zijn gekeurd, de nooduitgangen zijn vrij en de bewegwijzering is goed leesbaar. Alles is schoon en opgeruimd. De hekken en sloten zijn in orde, de toegangscontrole werkt en de camera's functioneren. Ik hoorde wel een lichte brom bij paneel drie, maar verder geen vreemde geuren of trillingen.

Als actie heb ik de olievlek opgeruimd en de beugels behandeld tegen roest. Verder niets bijzonders te melden. Mijn advies is om transformator twee over twee weken opnieuw te controleren op lekkage. Getekend, M.d.V.`,
  },
  en: {
    short: `Inspector Mark de Vries, 21 May 2025 at quarter past two in the afternoon, substation Borssele Alpha, station BA-02. Weather clear, around fourteen degrees. The switchgear is running normally, no alarms. At transformer two a slight oil stain and some early rust. Safety equipment in order, site clean, security functioning. Recommendation: re-check transformer two for leakage in two weeks. Signed, M.d.V.`,
    long: `Good afternoon, my name is Mark de Vries. Today is 21 May 2025, quarter past two in the afternoon. I'm carrying out the routine inspection at substation Borssele Alpha, station BA-02. The weather is clear, around fourteen degrees, with a moderate south-westerly wind.

My general impression is good: the platform looks tidy and well maintained. The switchgear and transformers are running normally, there are no alarms and temperatures stay within limits. However, at transformer two I see a slight oil stain on the floor and some early rust on the mounting brackets.

The safety equipment is in order — the fire extinguishers are inspected, the emergency exits are clear and the signage is easy to read. Everything is clean and tidy. The fences and locks are in order, access control works and the cameras are functioning. I did hear a faint hum at panel three, but no unusual smells or vibrations otherwise.

As an action I cleaned up the oil stain and treated the brackets against rust. Nothing else to report. My recommendation is to re-check transformer two for leakage in two weeks. Signed, M.d.V.`,
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
