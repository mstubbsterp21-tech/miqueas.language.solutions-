import crypto from "node:crypto";
import { database, readBody, send } from "./_shared/ops-v2-core.js";
import { getGoogleWorkspaceAccessToken } from "./_shared/gmail-oauth.js";

const spreadsheetId = process.env.MENTEE_INTEREST_SHEET_ID || "1o4IxQOK3WLlzCU1OWr6f1VCjHsMgF-VPVI0KqnPuCzg";
const sheetsWriteScope = "https://www.googleapis.com/auth/spreadsheets";
const allowedStatuses = new Set([
  "Interpreting student", "Recent ITP/IPP graduate", "Working interpreter",
  "Returning to the interpreting profession", "Other / Exploring interpreting",
]);
const credentialChoices = new Set(["NIC (RID)", "CDI (RID)", "BEI", "EIPA", "None", "Other"]);
const developmentChoices = new Set([
  "ASL expressive and receptive skills", "English-to-ASL interpreting",
  "ASL-to-English interpreting", "Processing and message equivalence",
  "Ethical decision-making", "Certification preparation", "Professional confidence",
  "Business and career development", "Other",
]);
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const blocks = ["Morning", "Afternoon", "Evening"];
const consentVersion = "mentee-practicum-nov-2026-v1";
const maxPayload = 20000;

function clipped(value, maxLength = 4000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
function invalid(message) { return { status: 400, message }; }
function collect(p) {
  const name = clipped(p.fullName, 160);
  const email = clipped(p.emailAddress, 254).toLowerCase();
  const location = clipped(p.locationTimeZone, 160);
  const status = clipped(p.interpreterStatus, 110);
  const education = clipped(p.educationExperience, 3000);
  const goals = clipped(p.mentorshipGoals, 3000);
  const certifications = Array.isArray(p.certifications) ? p.certifications : [];
  const development = Array.isArray(p.developmentAreas) ? p.developmentAreas : [];
  const availability = p.availability && typeof p.availability === "object" && !Array.isArray(p.availability) ? p.availability : {};
  if (!name || !location || !education || !goals || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return invalid("Please complete every required question with a valid email.");
  if (!allowedStatuses.has(status)) return invalid("Please choose a valid interpreting status.");
  if (!certifications.length || certifications.length > credentialChoices.size || certifications.some((x) => !credentialChoices.has(x)) || new Set(certifications).size !== certifications.length) return invalid("Please select valid credentials.");
  if (certifications.includes("None") && certifications.length > 1) return invalid("None cannot be selected with other credentials.");
  if (certifications.includes("Other") && !clipped(p.otherCertification, 350)) return invalid("Please specify your other credential.");
  if (development.length < 1 || development.length > 3 || development.some((x) => !developmentChoices.has(x)) || new Set(development).size !== development.length) return invalid("Please choose up to three development areas.");
  if (development.includes("Other") && !clipped(p.otherDevelopmentArea, 350)) return invalid("Please specify the other development area.");
  const knownKeys = days.flatMap((day) => blocks.map((block) => day + ":" + block));
  if (!knownKeys.some((key) => availability[key] === true)) return invalid("Please indicate at least one available time.");
  if (Object.entries(availability).some(([key, value]) => !knownKeys.includes(key) || typeof value !== "boolean")) return invalid("Your availability contains invalid selections.");
  if (p.recordingConsent !== true || p.youtubeObservationConsent !== true || p.consentVersion !== consentVersion) return invalid("Both recording and observation acknowledgments are required.");
  return {
    name, email, status, location, education, goals, certifications, development, availability,
    phone: clipped(p.phoneNumber, 60),
    otherCertification: clipped(p.otherCertification, 350),
    otherDevelopment: clipped(p.otherDevelopmentArea, 350),
    notes: clipped(p.schedulingNotes, 1000),
  };
}
function dayAvailability(availability, day) {
  return blocks.filter((block) => availability[day + ":" + block] === true).join(", ");
}
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { status: "error", message: "Use POST to submit the mentee interest form." });
  }
  if (Number(req.headers["content-length"] || 0) > maxPayload) return send(res, 413, { status: "error", message: "The submitted form is too large." });
  if (!String(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) return send(res, 415, { status: "error", message: "Please submit the form as JSON." });
  const origin = String(req.headers.origin || "");
  const requestHost = String(req.headers["x-forwarded-host"] || req.headers.host || "").toLowerCase();
  if (origin) {
    try {
      if (new URL(origin).host.toLowerCase() !== requestHost) return send(res, 403, { status: "error", message: "This request must come from the MLS website." });
    } catch {
      return send(res, 403, { status: "error", message: "Invalid origin." });
    }
  }
  const body = readBody(req);
  if (body.website) return send(res, 200, { status: "success" }); // Honeypot; never persist bot submissions.
  const data = collect(body);
  if (data.status === 400) return send(res, 400, { status: "error", message: data.message });
  try {
    const db = database();
    const access = await getGoogleWorkspaceAccessToken(db, [sheetsWriteScope]);
    if (!access.accessToken) {
      console.error("Mentee applications: Google Workspace Sheets write access is unavailable.", access.status);
      return send(res, 503, { status: "error", message: "Applications are temporarily unavailable. Please contact Miqueas Language Solutions." });
    }
    const submissionId = crypto.randomUUID();
    const row = [
      new Date().toISOString(), submissionId, data.name, data.email, data.phone,
      data.location, data.status, data.education, data.certifications.join(", "),
      data.otherCertification, data.development.join(", "), data.otherDevelopment, data.goals,
      ...days.map((day) => dayAvailability(data.availability, day)),
      data.notes, "Yes", "Yes", consentVersion, "New", "MLS Mentee Interest Form",
    ];
    const range = encodeURIComponent("'Mentee Applications'!A:Z");
    const url = "https://sheets.googleapis.com/v4/spreadsheets/" + encodeURIComponent(spreadsheetId) + "/values/" + range + ":append?valueInputOption=RAW&insertDataOption=INSERT_ROWS";
    const response = await fetch(url, {
      method: "POST",
      headers: { authorization: "Bearer " + access.accessToken, "content-type": "application/json" },
      body: JSON.stringify({ majorDimension: "ROWS", values: [row] }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.updates?.updatedRows) {
      console.error("Mentee applications: append failed", response.status, result.error?.status || "unknown");
      return send(res, 503, { status: "error", message: "Your application could not be saved right now. Please try again later." });
    }
    return send(res, 200, { status: "success", submissionId });
  } catch (error) {
    console.error("Mentee applications: unexpected submission failure", error?.message || "unknown");
    return send(res, 503, { status: "error", message: "Your application could not be saved right now. Please try again later." });
  }
}
