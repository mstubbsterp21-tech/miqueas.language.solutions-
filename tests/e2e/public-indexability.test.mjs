import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { staticFallbackForRoute } from "../../scripts/seo-static-fallback.js";
import { publicSiteEntries } from "../../src/seo/publishing.js";
import { siteMetadata } from "../../src/seo/siteMetadata.js";

test("public mentoring pages are in the sitemap registry", () => {
  const paths = new Set(publicSiteEntries(siteMetadata).map(([path]) => path));
  for (const path of ["/mentor-profile", "/mentee-interest"]) {
    assert.ok(paths.has(path), path + " is missing from the public sitemap");
    assert.ok(siteMetadata[path].title && siteMetadata[path].description);
  }
  for (const path of ["/portal", "/login", "/admin/interpreters", "/mentor-profile/recording-consent.html", "/mentor-profile/mentoring-agreement.html"]) {
    assert.equal(paths.has(path), false, path + " must not appear in the public sitemap");
  }
});

test("public mentor profile allows indexing while private mentoring documents do not", async () => {
  const root = new URL("../../public/mentor-profile/", import.meta.url);
  const profile = await readFile(new URL("index.html", root), "utf8");
  const consent = await readFile(new URL("recording-consent.html", root), "utf8");
  const agreement = await readFile(new URL("mentoring-agreement.html", root), "utf8");
  assert.match(profile, /<meta name="robots" content="index, follow"/);
  assert.match(profile, /<link rel="canonical" href="https:\/\/miqueaslanguagesolutions\.com\/mentor-profile"/);
  assert.match(consent, /<meta name="robots" content="noindex,nofollow,noarchive"/);
  assert.match(agreement, /<meta name="robots" content="noindex,nofollow,noarchive"/);
});

test("mentee application and public legal policies have crawlable content", async () => {
  for (const path of ["/mentee-interest", "/policies/clients", "/policies/consumers", "/policies/interpreters", "/privacy", "/terms", "/accessibility"]) {
    const html = await staticFallbackForRoute(path, siteMetadata[path], publicSiteEntries(siteMetadata));
    const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    assert.ok(text.split(/\s+/).length > 120, path + " lacks readable content");
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert.match(html, /href="\/mentor-profile"/);
    assert.doesNotMatch(html, /href="\/mentor-profile\/recording-consent/);
  }
});
