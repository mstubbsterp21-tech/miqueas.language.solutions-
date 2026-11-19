import assert from "node:assert/strict";
import test from "node:test";
import { staticFallbackForRoute } from "../../scripts/seo-static-fallback.js";
import { publicSiteEntries } from "../../src/seo/publishing.js";

test("published articles are linked in crawlable blog HTML, but future posts are not", async () => {
  const entries = publicSiteEntries({
    "/blog/published": { title: "Published resource | MLS", description: "A useful article.", publishDate: "2026-10-01" },
    "/blog/future": { title: "Future resource | MLS", description: "Not yet live.", publishDate: "2026-12-20" },
  }, "2026-11-19");
  const html = await staticFallbackForRoute("/blog", {
    title: "MLS Blog | MLS", description: "Communication access articles.",
  }, entries);
  assert.match(html, /href="\/blog\/published"/);
  assert.match(html, /Published resource/);
  assert.doesNotMatch(html, /href="\/blog\/future"/);
  assert.match(html, /href="\/settings\/medical"/);
});

test("important public pages have meaningful HTML, not only navigation", async () => {
  for (const path of ["/", "/services", "/about", "/join-our-team", "/settings/medical", "/services/english-asl-translation"]) {
    const html = await staticFallbackForRoute(path, {
      title: "MLS Services | MLS", description: "ASL-English communication access.",
    }, []);
    const visibleText = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    assert.ok(visibleText.split(/\s+/).length >= 110, path + " should have substantial readable copy");
    assert.match(html, /href="\/contact"/);
    assert.equal((html.match(/<h1>/g) || []).length, 1);
  }
});
