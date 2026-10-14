import { SITE_URL, siteMetadata } from "../../src/seo/siteMetadata.js";
import { publicSiteEntries } from "../../src/seo/publishing.js";

export default function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }

  const entries = publicSiteEntries(siteMetadata);
  const escapeXml = (value) => String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&apos;");
  const urls = entries.map(([path, meta]) => {
    const lastmod = meta.dateModified || meta.publishDate || null;
    return [
      "  <url>",
      `    <loc>${escapeXml(SITE_URL + (path === "/" ? "/" : path))}</loc>`,
      ...(lastmod ? [`    <lastmod>${escapeXml(lastmod)}</lastmod>`] : []),
      `    <changefreq>${path === "/" || path === "/blog" ? "weekly" : "monthly"}</changefreq>`,
      `    <priority>${meta.priority || "0.6"}</priority>`,
      "  </url>",
    ].join("\n");
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).end(req.method === "HEAD" ? undefined : xml);
}
