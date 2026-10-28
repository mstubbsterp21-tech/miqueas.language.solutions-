// Fail-closed publication approval for new MLS blog posts.
//
// Historical articles published on or before the cutover date remain available.
// Every later article needs an explicit approval for its exact content revision.
// The Sunday MLS Pre-Publication Audit must review the article before adding an
// approval record. A subsequent edit automatically invalidates that approval.
//
// Approval entry example:
// "my-slug": { publishDate: "2026-11-02", fingerprint: "12ab34cd" }
//
// The fingerprint is derived from the complete article content and its metadata.
export const BLOG_REVIEW_GATE_CUTOVER = "2026-10-28";

export const approvedBlogRevisions = Object.freeze({
  // Approved future articles go here only after editorial review.
});

export function blogContentFingerprint(post) {
  const serialized = JSON.stringify([
    post.slug || "",
    post.title || "",
    post.excerpt || "",
    post.publishDate || "",
    post.category || "",
    post.readTime || "",
    post.html || null,
    post.content || null,
  ]);
  // Deterministic FNV-1a checksum: change detection, not a security signature.
  let hash = 0x811c9dc5;
  for (let i = 0; i < serialized.length; i += 1) {
    hash ^= serialized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function isBlogReviewApproved(post) {
  if (!post?.publishDate || post.publishDate <= BLOG_REVIEW_GATE_CUTOVER) return true;
  const record = approvedBlogRevisions[post.slug];
  return Boolean(
    record
    && record.publishDate === post.publishDate
    && record.fingerprint === blogContentFingerprint(post),
  );
}

// SEO metadata has no article HTML; the client-side article gate additionally
// verifies the fingerprint. The approval record controls sitemap discovery.
export function isBlogReviewApprovedInMetadata(path, meta) {
  if (!path.startsWith("/blog/") || !meta?.publishDate || meta.publishDate <= BLOG_REVIEW_GATE_CUTOVER) return true;
  const slug = path.slice("/blog/".length);
  const record = approvedBlogRevisions[slug];
  return Boolean(record && record.publishDate === meta.publishDate && record.fingerprint);
}
