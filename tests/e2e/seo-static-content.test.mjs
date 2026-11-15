import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function builtPage(path) {
  return readFile(join(process.cwd(), "dist", path), "utf8");
}

test("public pages provide readable content without JavaScript", async () => {
  const pages = [
    ["index.html", "ASL Interpreter Services in Florida"],
    ["services.html", "ASL Interpreting & Translation Services"],
    ["locations/orlando.html", "ASL Interpreting Services in Orlando"],
    ["services/video-remote-interpreting.html", "Video Remote ASL Interpreting Services"],
  ];
  for (const [path, heading] of pages) {
    const html = await builtPage(path);
    assert.match(html, /name="mls-prerendered-page" content="1"/);
    assert.match(html, /data-mls-seo-fallback="true"/);
    assert.match(html, /<main>[\s\S]*<h1>[\s\S]*<\/h1>/);
    assert.ok(html.includes(heading), "Missing expected heading for " + path);
    assert.match(html, /href="\/contact"/);
    assert.match(html, /<link rel="canonical" href="https:\/\/miqueaslanguagesolutions.com\//);
  }
});

test("published blog articles have substantial server-readable article text", async () => {
  const html = await builtPage("blog/front-desk-communication-access-deaf-consumers.html");
  assert.match(html, /<h1>The Front Desk Is Where Access Breaks/);
  assert.match(html, /The front desk is a communication access point/);
  assert.match(html, /<article>[\s\S]*<h2>/);
  assert.ok(html.length > 10000, "Expected full article text in the HTML fallback");
});

test("unpublished blog drafts are not exported as indexable pages", async () => {
  const { siteMetadata } = await import("../../src/seo/siteMetadata.js");
  const { publicSiteEntries } = await import("../../src/seo/publishing.js");
  const published = new Set(publicSiteEntries(siteMetadata).map(([path]) => path));
  const { isBlogReviewApprovedInMetadata } = await import("../../src/seo/blogReviewGate.js");
  for (const [path, meta] of Object.entries(siteMetadata)) {
    if (path.startsWith("/blog/") && !isBlogReviewApprovedInMetadata(path, meta)) {
      assert.equal(published.has(path), false, "Unreviewed article should not be published: " + path);
    }
  }
});
