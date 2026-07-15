import { randomUUID } from "node:crypto";
import { audit, clientFor, interpreterFor } from "./ops-v2-core.js";

const PROFILE_MEDIA_BUCKET = "profile-media";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const PROFILE_TYPES = new Set(["client", "interpreter"]);
const MEDIA_TYPES = new Set(["avatar", "banner"]);
const BACKGROUND_STYLES = new Set(["soft", "clean", "gradient", "dark"]);
const CARD_STYLES = new Set(["rounded", "glass", "flat"]);

function text(value, max = 2000) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized.slice(0, max) : null;
}

function color(value, fallback) {
  const normalized = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized.toLowerCase() : fallback;
}

function url(value) {
  const normalized = text(value, 500);
  if (!normalized) return null;
  try {
    const parsed = new URL(normalized);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function layout(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))].slice(0, 20);
}

function visibility(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => String(key || "").trim())
      .slice(0, 30)
      .map(([key, shown]) => [String(key).slice(0, 80), Boolean(shown)]),
  );
}

function links(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).map((item) => ({
    label: text(item?.label, 40),
    url: url(item?.url),
  })).filter((item) => item.label && item.url);
}

function sanitizeFileName(fileName) {
  return String(fileName || "image")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-120);
}

function validateImage(fileName, fileSize) {
  const safeName = sanitizeFileName(fileName);
  const extension = safeName.split(".").pop()?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.has(extension)) return "Upload a JPG, PNG, or WebP image.";
  if (Number(fileSize || 0) <= 0) return "Choose an image to upload.";
  if (Number(fileSize || 0) > MAX_IMAGE_BYTES) return "Profile images must be 8 MB or smaller.";
  return "";
}

async function ensureOwnInterpreter(db, user) {
  const existing = await interpreterFor(db, user.id);
  if (existing) return existing;
  const result = await db.from("interpreters").insert({
    clerk_user_id: user.id,
    email: user.email,
    first_name: user.firstName || null,
    last_name: user.lastName || null,
    roster_status: user.isAdmin ? "active" : "pending_profile",
  }).select("*").single();
  if (result.error) throw result.error;
  return result.data;
}

async function resolveTarget(db, user, body = {}) {
  const profileType = PROFILE_TYPES.has(body.profileType) ? body.profileType : null;
  if (!profileType) return { error: "Choose a client or interpreter profile." };

  const table = profileType === "client" ? "clients" : "interpreters";
  const ownerColumn = profileType === "client" ? "client_id" : "interpreter_id";
  let record = null;

  if (user.isAdmin && body.ownerId) {
    const result = await db.from(table).select("*").eq("id", body.ownerId).maybeSingle();
    if (result.error) throw result.error;
    record = result.data;
  } else if (profileType === "client") {
    record = await clientFor(db, user.id);
  } else {
    record = await ensureOwnInterpreter(db, user);
  }

  if (!record) return { error: `${profileType === "client" ? "Client" : "Interpreter"} profile not found.` };
  if (!user.isAdmin && record.clerk_user_id !== user.id) return { error: "You can only customize your own profile." };

  return { profileType, table, ownerColumn, record };
}

async function getCustomization(db, target) {
  const result = await db.from("profile_customizations").select("*").eq(target.ownerColumn, target.record.id).maybeSingle();
  if (result.error) throw result.error;
  return result.data;
}

async function signedMedia(db, row) {
  if (!row) return null;
  const paths = [row.avatar_path, row.banner_path].filter(Boolean);
  let avatarUrl = null;
  let bannerUrl = null;
  if (paths.length) {
    const result = await db.storage.from(PROFILE_MEDIA_BUCKET).createSignedUrls(paths, 3600);
    if (!result.error) {
      const signedByPath = new Map((result.data || []).map((item) => [item.path, item.signedUrl]));
      avatarUrl = row.avatar_path ? signedByPath.get(row.avatar_path) || null : null;
      bannerUrl = row.banner_path ? signedByPath.get(row.banner_path) || null : null;
    }
  }
  return { ...row, avatar_url: avatarUrl, banner_url: bannerUrl };
}

export async function loadProfileCustomizationForRecord(db, profileType, record) {
  if (!record?.id || !PROFILE_TYPES.has(profileType)) return null;
  const ownerColumn = profileType === "client" ? "client_id" : "interpreter_id";
  const result = await db.from("profile_customizations").select("*").eq(ownerColumn, record.id).maybeSingle();
  if (result.error) throw result.error;
  return signedMedia(db, result.data);
}

export async function loadProfileCustomizationCollection(db) {
  const result = await db.from("profile_customizations").select("*").order("updated_at", { ascending: false });
  if (result.error) throw result.error;
  return Promise.all((result.data || []).map((row) => signedMedia(db, row)));
}

export async function saveProfileCustomization(db, user, body) {
  const target = await resolveTarget(db, user, body);
  if (target.error) return { status: 400, payload: { error: target.error } };
  const before = await getCustomization(db, target);
  const source = body?.customization || {};
  const payload = {
    profile_type: target.profileType,
    client_id: target.profileType === "client" ? target.record.id : null,
    interpreter_id: target.profileType === "interpreter" ? target.record.id : null,
    clerk_user_id: target.record.clerk_user_id || user.id,
    display_name: text(source.display_name, 120),
    headline: text(source.headline, 160),
    bio: text(source.bio, 2000),
    location_label: text(source.location_label, 160),
    website_url: url(source.website_url),
    theme_primary: color(source.theme_primary, "#721100"),
    theme_secondary: color(source.theme_secondary, "#24130e"),
    theme_accent: color(source.theme_accent, "#dd7d00"),
    background_style: BACKGROUND_STYLES.has(source.background_style) ? source.background_style : "soft",
    card_style: CARD_STYLES.has(source.card_style) ? source.card_style : "rounded",
    section_layout: layout(source.section_layout),
    section_visibility: visibility(source.section_visibility),
    social_links: links(source.social_links),
    updated_at: new Date().toISOString(),
  };

  let saved;
  if (before?.id) {
    const result = await db.from("profile_customizations").update(payload).eq("id", before.id).select("*").single();
    if (result.error) throw result.error;
    saved = result.data;
  } else {
    const result = await db.from("profile_customizations").insert(payload).select("*").single();
    if (result.error) throw result.error;
    saved = result.data;
  }

  await audit(db, user, {
    action: "profile_customization_saved",
    entityType: "profile_customization",
    entityId: saved.id,
    summary: `${target.profileType} profile appearance and layout updated`,
    before,
    after: saved,
  });

  return { status: 200, payload: { customization: await signedMedia(db, saved) } };
}

export async function createProfileMediaUploadUrl(db, user, body) {
  const target = await resolveTarget(db, user, body);
  if (target.error) return { status: 400, payload: { error: target.error } };
  const mediaType = MEDIA_TYPES.has(body?.mediaType) ? body.mediaType : null;
  if (!mediaType) return { status: 400, payload: { error: "Choose avatar or banner." } };
  const validationError = validateImage(body?.fileName, body?.fileSize);
  if (validationError) return { status: 400, payload: { error: validationError } };

  const path = `${target.profileType}s/${target.record.id}/${mediaType}/${Date.now()}-${randomUUID()}-${sanitizeFileName(body.fileName)}`;
  const result = await db.storage.from(PROFILE_MEDIA_BUCKET).createSignedUploadUrl(path);
  if (result.error) throw result.error;
  return { status: 200, payload: { bucket: PROFILE_MEDIA_BUCKET, path, token: result.data.token, signedUrl: result.data.signedUrl } };
}

export async function recordProfileMediaUpload(db, user, body) {
  const target = await resolveTarget(db, user, body);
  if (target.error) return { status: 400, payload: { error: target.error } };
  const mediaType = MEDIA_TYPES.has(body?.mediaType) ? body.mediaType : null;
  if (!mediaType || !body?.storagePath) return { status: 400, payload: { error: "Incomplete profile image details." } };
  const prefix = `${target.profileType}s/${target.record.id}/${mediaType}/`;
  if (!String(body.storagePath).startsWith(prefix)) return { status: 403, payload: { error: "That profile image path is not authorized." } };

  const before = await getCustomization(db, target);
  const field = mediaType === "avatar" ? "avatar_path" : "banner_path";
  const base = {
    profile_type: target.profileType,
    client_id: target.profileType === "client" ? target.record.id : null,
    interpreter_id: target.profileType === "interpreter" ? target.record.id : null,
    clerk_user_id: target.record.clerk_user_id || user.id,
    updated_at: new Date().toISOString(),
  };

  let saved;
  if (before?.id) {
    const result = await db.from("profile_customizations").update({ ...base, [field]: body.storagePath }).eq("id", before.id).select("*").single();
    if (result.error) throw result.error;
    saved = result.data;
  } else {
    const result = await db.from("profile_customizations").insert({ ...base, [field]: body.storagePath }).select("*").single();
    if (result.error) throw result.error;
    saved = result.data;
  }

  const oldPath = before?.[field];
  if (oldPath && oldPath !== body.storagePath) await db.storage.from(PROFILE_MEDIA_BUCKET).remove([oldPath]);

  await audit(db, user, {
    action: `profile_${mediaType}_updated`,
    entityType: "profile_customization",
    entityId: saved.id,
    summary: `${target.profileType} profile ${mediaType} updated`,
    before: before ? { [field]: oldPath } : null,
    after: { [field]: body.storagePath },
  });

  return { status: 200, payload: { customization: await signedMedia(db, saved) } };
}

export async function removeProfileMedia(db, user, body) {
  const target = await resolveTarget(db, user, body);
  if (target.error) return { status: 400, payload: { error: target.error } };
  const mediaType = MEDIA_TYPES.has(body?.mediaType) ? body.mediaType : null;
  if (!mediaType) return { status: 400, payload: { error: "Choose avatar or banner." } };
  const current = await getCustomization(db, target);
  if (!current?.id) return { status: 200, payload: { customization: null } };
  const field = mediaType === "avatar" ? "avatar_path" : "banner_path";
  const oldPath = current[field];
  if (oldPath) await db.storage.from(PROFILE_MEDIA_BUCKET).remove([oldPath]);
  const result = await db.from("profile_customizations").update({ [field]: null, updated_at: new Date().toISOString() }).eq("id", current.id).select("*").single();
  if (result.error) throw result.error;
  await audit(db, user, {
    action: `profile_${mediaType}_removed`,
    entityType: "profile_customization",
    entityId: current.id,
    summary: `${target.profileType} profile ${mediaType} removed`,
    before: { [field]: oldPath },
    after: { [field]: null },
  });
  return { status: 200, payload: { customization: await signedMedia(db, result.data) } };
}
