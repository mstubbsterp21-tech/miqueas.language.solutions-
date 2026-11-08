import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { settingOrder, settingPages } from "../../src/content/settingPages.js";
import { siteMetadata } from "../../src/seo/siteMetadata.js";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

test("all four MLS setting pages have distinct content and existing visuals", () => {
  assert.deepEqual(settingOrder, ["medical", "educational", "business", "community"]);
  assert.equal(new Set(settingOrder.map((id) => settingPages[id].hero)).size, 4);
  for (const id of settingOrder) {
    const page = settingPages[id];
    assert.equal(typeof page.headline, "string");
    assert.ok(page.headline.length > 25, id + " needs a meaningful headline");
    assert.ok(page.intro.length > 90, id + " needs a specific introduction");
    assert.ok(page.heroAlt.length > 20, id + " needs descriptive image text");
    assert.ok(existsSync(join(root, "public", page.hero.replace(/^\//, ""))), id + " hero asset must exist");
    assert.equal(page.moments.length, 4);
    assert.equal(page.supports.length, 3);
    assert.equal(page.prep.length, 3);
    assert.ok(page.faqs.length >= 3);
    assert.ok(page.scenario.text.length > 100);
    assert.ok(page.mode.onSite && page.mode.vri && page.mode.caution);
    assert.ok(page.related.href.startsWith("/blog/"));
  }
});

test("homepage cards, services chips, router and metadata all expose each setting", () => {
  const home = read("src/pages/Home.jsx");
  const services = read("src/pages/Services.jsx");
  const router = read("src/App.jsx");
  const page = read("src/pages/SettingDetail.jsx");
  assert.match(home, /sectors\.map\(\(\{ id, icon: Icon/);
  assert.match(home, /to=\{"\/settings\/" \+ id\}/);
  assert.match(services, /to=\{"\/settings\/" \+ title\.toLowerCase\(\)\}/);
  assert.match(router, /path="\/settings\/:settingId"/);
  assert.match(page, /aria-current=\{active \? "page"/);
  assert.match(page, /<summary/);
  for (const id of settingOrder) {
    assert.equal(siteMetadata["/settings/" + id].schemaType, "Service");
    assert.ok(siteMetadata["/settings/" + id].description.length > 80);
  }
});

test("Vite produces individual searchable pages for every setting", () => {
  const dist = join(root, "dist");
  if (!existsSync(dist)) return;
  for (const id of settingOrder) {
    const htmlPath = join(dist, "settings", id + ".html");
    assert.ok(existsSync(htmlPath), "Missing static page: " + id);
    const html = readFileSync(htmlPath, "utf8");
    assert.ok(html.includes("https://miqueaslanguagesolutions.com/settings/" + id));
    assert.ok(html.includes("application/ld+json"));
  }
});
