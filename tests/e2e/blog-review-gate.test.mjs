import test from "node:test";
import assert from "node:assert/strict";
import {
  BLOG_REVIEW_GATE_CUTOVER,
  blogContentFingerprint,
  isBlogReviewApproved,
  isBlogReviewApprovedInMetadata,
} from "../../src/seo/blogReviewGate.js";
import { publicSiteEntries } from "../../src/seo/publishing.js";

test("all already published articles are grandfathered without changing their visibility", () => {
  assert.equal(BLOG_REVIEW_GATE_CUTOVER, "2026-10-28");
  assert.equal(isBlogReviewApproved({ slug: "old-post", publishDate: "2026-10-26" }), true);
  assert.equal(isBlogReviewApprovedInMetadata("/blog/old-post", { publishDate: "2026-10-26" }), true);
});

test("future scheduled articles are held without an explicit fingerprint approval", () => {
  const post = { slug: "future-test", title: "Test article", excerpt: "Test", publishDate: "2026-11-02", category: "Access" };
  assert.equal(isBlogReviewApproved(post), false);
  assert.equal(isBlogReviewApprovedInMetadata("/blog/future-test", post), false);
  const entries = {
    "/": { priority: "1.0" },
    "/blog/old-post": { publishDate: "2026-10-26" },
    "/blog/future-test": { publishDate: "2026-11-02" },
  };
  assert.deepEqual(publicSiteEntries(entries, "2026-11-02").map(([path]) => path), ["/", "/blog/old-post"]);
});

test("content fingerprints change when a reviewed article is edited", () => {
  const original = {
    slug: "test", title: "Title", excerpt: "Summary", category: "Access",
    publishDate: "2026-11-02", readTime: "7 min read", html: "<p>A factual article.</p>",
  };
  assert.match(blogContentFingerprint(original), /^[0-9a-f]{8}$/);
  assert.notEqual(blogContentFingerprint(original), blogContentFingerprint({ ...original, html: "<p>Revised article.</p>" }));
  assert.notEqual(blogContentFingerprint(original), blogContentFingerprint({ ...original, title: "Different title" }));
});
