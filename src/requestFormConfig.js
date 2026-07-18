export const INTERPRETER_REQUEST_SERVICE_OPTIONS = [
  "In-Person Interpreting",
  "Video Remote Interpreting",
  "ASL Video Translation (English → ASL)",
  "ASL Content Translation (ASL → English)",
];

export const INTERPRETER_REQUEST_SETTING_OPTIONS = [
  "Medical",
  "Legal",
  "Edu. K-12",
  "Edu. Post Secondary",
  "Cruise",
  "Mental Health",
  "General / Community",
  "Business",
  "Platform / Conference",
  "Performance / Artistic",
  "Other",
];

export const INTERPRETER_REQUEST_COMMUNICATION_STYLE_OPTIONS = [
  "ASL (American Sign Language)",
  "PTASL (Pro-Tactile ASL)",
  "CASE (Conceptually Accurate Signed English)",
  "MCE (Manually Coded English)",
  "Cued Speech",
  "Other",
];

export const INTERPRETER_REQUEST_ADDITIONAL_CONSIDERATION_OPTIONS = [
  "DeafBlind",
  "Low Vision",
  "Low Mobility",
  "Language still developing / non-standard language use",
  "Uses a foreign sign language",
  "Other",
];

export const EMPTY_CLIENT_REQUEST_DEFAULTS = {
  serviceNeeded: "",
  setting: "",
  settingOther: "",
  communicationStyles: [],
  communicationStyleOther: "",
  hearingParticipantsLanguages: "",
  additionalConsiderations: [],
  additionalConsiderationsOther: "",
  cdiOrAdditionalSupportNeeded: "",
  communicationNotes: "",
};

function cleanList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value).split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
}

function optionMatch(value, options) {
  const normalized = String(value || "").trim().toLowerCase();
  return options.find((option) => option.toLowerCase() === normalized) || "";
}

function inferCommunicationStyles(text = "") {
  const rules = [
    [/\bptasl\b|pro[- ]?tactile/i, "PTASL (Pro-Tactile ASL)"],
    [/\bcase\b|conceptually accurate signed english/i, "CASE (Conceptually Accurate Signed English)"],
    [/\bmce\b|manually coded english/i, "MCE (Manually Coded English)"],
    [/cued speech/i, "Cued Speech"],
    [/\basl\b|american sign language/i, "ASL (American Sign Language)"],
  ];
  return rules.filter(([pattern]) => pattern.test(text)).map(([, label]) => label);
}

function inferAdditionalConsiderations(text = "") {
  const rules = [
    [/deaf\s*blind/i, "DeafBlind"],
    [/low vision/i, "Low Vision"],
    [/low mobility|mobility/i, "Low Mobility"],
    [/language still developing|non[- ]?standard language/i, "Language still developing / non-standard language use"],
    [/foreign sign language/i, "Uses a foreign sign language"],
  ];
  return rules.filter(([pattern]) => pattern.test(text)).map(([, label]) => label);
}

export function normalizeRequestService(value, legacyDelivery = "") {
  const exact = optionMatch(value, INTERPRETER_REQUEST_SERVICE_OPTIONS);
  if (exact) return exact;

  const service = String(value || "").toLowerCase();
  const delivery = String(legacyDelivery || "").toLowerCase();
  if (service.includes("content translation") || service.includes("asl → english") || service.includes("asl > english")) {
    return "ASL Content Translation (ASL → English)";
  }
  if (service.includes("video translation") || service.includes("english → asl") || service.includes("english > asl")) {
    return "ASL Video Translation (English → ASL)";
  }
  if (delivery.includes("vri") || delivery.includes("virtual") || service.includes("video remote")) {
    return "Video Remote Interpreting";
  }
  if (delivery.includes("on-site") || delivery.includes("onsite") || service.includes("interpreting") || service.includes("deafblind") || service.includes("deaf interpreter")) {
    return "In-Person Interpreting";
  }
  return "";
}

export function normalizeRequestSetting(value) {
  const raw = String(value || "").trim();
  if (!raw) return { setting: "", settingOther: "" };
  if (/^other\s*:/i.test(raw)) return { setting: "Other", settingOther: raw.replace(/^other\s*:\s*/i, "").trim() };

  const exact = optionMatch(raw, INTERPRETER_REQUEST_SETTING_OPTIONS);
  if (exact) return { setting: exact, settingOther: "" };

  const aliases = [
    [/general|community/i, "General / Community"],
    [/k[- ]?12/i, "Edu. K-12"],
    [/post[- ]?secondary|college|university/i, "Edu. Post Secondary"],
    [/conference|platform/i, "Platform / Conference"],
    [/performance|artistic|theater|theatre/i, "Performance / Artistic"],
    [/mental health|behavioral/i, "Mental Health"],
  ];
  const alias = aliases.find(([pattern]) => pattern.test(raw));
  if (alias) return { setting: alias[1], settingOther: "" };

  // Legacy delivery values are not settings and should not silently become one.
  if (/^(on[- ]?site|vri|hybrid|virtual)$/i.test(raw)) return { setting: "", settingOther: "" };
  return { setting: "Other", settingOther: raw };
}

export function normalizeClientRequestDefaults(value = {}, client = {}) {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const legacyNotes = String(client.communication_preferences || "");
  const settingResult = normalizeRequestSetting(raw.setting || client.default_delivery_mode);
  const legacyService = String(client.default_service_type || "");
  const legacyDeafBlind = /deaf\s*blind|pro[- ]?tactile/i.test(legacyService);
  const legacyCdi = /certified deaf interpreter|\bcdi\b/i.test(legacyService);

  const communicationStyles = cleanList(raw.communicationStyles).filter((item) => INTERPRETER_REQUEST_COMMUNICATION_STYLE_OPTIONS.includes(item));
  const considerations = cleanList(raw.additionalConsiderations).filter((item) => INTERPRETER_REQUEST_ADDITIONAL_CONSIDERATION_OPTIONS.includes(item));

  return {
    ...EMPTY_CLIENT_REQUEST_DEFAULTS,
    ...raw,
    serviceNeeded: normalizeRequestService(raw.serviceNeeded || legacyService, client.default_delivery_mode),
    setting: settingResult.setting,
    settingOther: raw.settingOther || settingResult.settingOther,
    communicationStyles: communicationStyles.length ? communicationStyles : [
      ...inferCommunicationStyles(legacyNotes),
      ...(legacyDeafBlind ? ["PTASL (Pro-Tactile ASL)"] : []),
    ].filter((item, index, list) => list.indexOf(item) === index),
    communicationStyleOther: String(raw.communicationStyleOther || ""),
    hearingParticipantsLanguages: String(raw.hearingParticipantsLanguages || ""),
    additionalConsiderations: considerations.length ? considerations : [
      ...inferAdditionalConsiderations(legacyNotes),
      ...(legacyDeafBlind ? ["DeafBlind"] : []),
    ].filter((item, index, list) => list.indexOf(item) === index),
    additionalConsiderationsOther: String(raw.additionalConsiderationsOther || ""),
    cdiOrAdditionalSupportNeeded: String(raw.cdiOrAdditionalSupportNeeded || (legacyCdi ? "Yes" : "")),
    communicationNotes: String(raw.communicationNotes ?? legacyNotes),
  };
}

export function requestDefaultsFromClient(client = {}) {
  return normalizeClientRequestDefaults(client.request_defaults, client);
}

export function displayRequestSetting(defaults = {}) {
  if (defaults.setting === "Other" && defaults.settingOther) return `Other: ${defaults.settingOther}`;
  return defaults.setting || "";
}

export function applyRequestDefaultsToClient(client = {}, defaults = {}) {
  const normalized = normalizeClientRequestDefaults(defaults, {});
  return {
    ...client,
    default_service_type: normalized.serviceNeeded || null,
    default_delivery_mode: displayRequestSetting(normalized) || null,
    communication_preferences: normalized.communicationNotes || null,
    request_defaults: normalized,
  };
}
