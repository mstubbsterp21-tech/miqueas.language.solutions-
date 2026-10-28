import { isBlogReviewApprovedInMetadata } from "./blogReviewGate.js";

// Publication timestamps are compared in the same time zone as the MLS blog.
export function todayInNewYork(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const fields = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${fields.year}-${fields.month}-${fields.day}`;
}

export function isPubliclyPublished(meta, today = todayInNewYork(), path = "") {
  return (!meta?.publishDate || meta.publishDate <= today)
    && isBlogReviewApprovedInMetadata(path, meta);
}

export function publicSiteEntries(siteMetadata, today = todayInNewYork()) {
  return Object.entries(siteMetadata).filter(([path, meta]) => isPubliclyPublished(meta, today, path));
}
