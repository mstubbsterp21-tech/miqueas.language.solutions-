// Publication timestamps are compared in the same time zone as the MLS blog.
export function todayInNewYork(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

export function isPubliclyPublished(meta, today = todayInNewYork()) {
  return !meta?.publishDate || meta.publishDate <= today;
}

export function publicSiteEntries(siteMetadata, today = todayInNewYork()) {
  return Object.entries(siteMetadata).filter(([, meta]) => isPubliclyPublished(meta, today));
}
