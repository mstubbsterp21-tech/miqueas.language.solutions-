import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { cwd } from "node:process";
import { DEFAULT_IMAGE, SITE_URL, schemaForRoute, siteMetadata } from "../src/seo/siteMetadata.js";

const escapeAttribute = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

function replaceHead(html, path, meta) {
  const canonical = `${SITE_URL}${path === "/" ? "/" : path}`;
  const schemas = schemaForRoute(path, meta);
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttribute(meta.title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${escapeAttribute(meta.description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapeAttribute(meta.title)}" />`)
    .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${escapeAttribute(meta.description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escapeAttribute(meta.title)}" />`)
    .replace(/<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${escapeAttribute(meta.description)}" />`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify(schemas)}</script>`)
    .replace(/<meta\s+name="keywords"[\s\S]*?\/>/, "");
}

export default function seoStaticPages() {
  return {
    name: "mls-seo-static-pages",
    apply: "build",
    async closeBundle() {
      const dist = join(cwd(), "dist");
      const template = await readFile(join(dist, "index.html"), "utf8");
      const today = new Date().toISOString().slice(0, 10);

      for (const [path, meta] of Object.entries(siteMetadata)) {
        if (path === "/") {
          await writeFile(join(dist, "index.html"), replaceHead(template, path, meta));
          continue;
        }
        const output = join(dist, `${path.slice(1)}.html`);
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, replaceHead(template, path, meta));
      }

      const urls = Object.entries(siteMetadata).map(([path, meta]) => [
        "  <url>",
        `    <loc>${SITE_URL}${path === "/" ? "/" : path}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${path === "/" || path === "/blog" ? "weekly" : "monthly"}</changefreq>`,
        `    <priority>${meta.priority || "0.6"}</priority>`,
        "  </url>",
      ].join("\n"));
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
      await writeFile(join(dist, "sitemap.xml"), sitemap);
    },
  };
}
