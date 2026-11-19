import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { cwd } from "node:process";
import { DEFAULT_IMAGE, SITE_URL, schemaForRoute, siteMetadata } from "../src/seo/siteMetadata.js";
import { publicSiteEntries } from "../src/seo/publishing.js";
import { staticFallbackForRoute, fallbackStyles } from "./seo-static-fallback.js";

const escapeAttribute = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

async function replaceHead(html, path, meta, published) {
  const canonical = `${SITE_URL}${path === "/" ? "/" : path}`;
  const schemas = schemaForRoute(path, meta);
  const fallback = await staticFallbackForRoute(path, meta, published);
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
    .replace(/<meta\s+name="keywords"[\s\S]*?\/>/, "")
    .replace("</head>", '<meta name="mls-prerendered-page" content="1" />' + fallbackStyles + "</head>")
    .replace('<div id="root"></div>', '<div id="root">' + fallback + "</div>");
}

export default function seoStaticPages() {
  return {
    name: "mls-seo-static-pages",
    apply: "build",
    async closeBundle() {
      const dist = join(cwd(), "dist");
      const template = await readFile(join(dist, "index.html"), "utf8");
      const published = publicSiteEntries(siteMetadata);

      for (const [path, meta] of published) {
        if (path === "/") {
          await writeFile(join(dist, "index.html"), await replaceHead(template, path, meta, published));
          continue;
        }
        const output = join(dist, `${path.slice(1)}.html`);
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, await replaceHead(template, path, meta, published));
      }

      // Sitemap is generated at request time by /api/sitemap so scheduled
      // articles appear at New York midnight without deploying new code.
    },
  };
}
