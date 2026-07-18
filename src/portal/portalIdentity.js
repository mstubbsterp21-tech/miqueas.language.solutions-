function cleanName(parts) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
}

export function interpreterProfileName(workspace) {
  const profile = workspace?.interpreter?.profile;
  return cleanName([profile?.first_name, profile?.last_name]);
}

export function portalDisplayName({ role, workspace, personalization, fallbackName = "" }) {
  const profileName = role === "interpreter" ? interpreterProfileName(workspace) : "";
  const clerkName = cleanName([workspace?.user?.firstName, workspace?.user?.lastName]);
  const customName = String(personalization?.display_name || "").trim();
  return profileName
    || (role === "interpreter" ? customName : clerkName)
    || (role === "interpreter" ? clerkName : customName)
    || String(fallbackName || "").trim()
    || String(workspace?.user?.email || "").trim();
}

export function firstNameFromDisplayName(displayName) {
  return String(displayName || "").trim().split(/\s+/)[0] || "";
}
