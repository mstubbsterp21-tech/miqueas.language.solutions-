import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";

// This is the no-JavaScript version of the public marketing site, not a bot-only
// page. React replaces it with the interactive equivalent when it mounts.
// Its text and links are usable by visitors whose browsers do not run JS.
const serviceLinks = [
  ["/services/in-person-interpreting", "In-person ASL interpreting"],
  ["/services/video-remote-interpreting", "Video remote interpreting"],
  ["/services/english-asl-translation", "English to ASL video translation"],
  ["/services/asl-english-translation", "ASL to English translation"],
];
const areaLinks = [
  ["/locations/orlando", "Orlando"],
  ["/locations/ocala", "Ocala and Marion County"],
  ["/locations/central-florida", "Central Florida"],
  ["/services/video-remote-interpreting-nationwide", "Nationwide remote interpreting"],
];
const globalLinks = [
  ["/", "Home"], ["/services", "Services"], ["/about", "About MLS"],
  ["/blog", "Communication access blog"], ["/contact", "Request services"],
];

const specificCopy = {
  "/": [
    "Miqueas Language Solutions coordinates professional ASL-English interpreting and ASL video translation. Services include on-site interpreting for live settings, video remote interpreting for suitable online encounters, English-to-ASL video translation, and ASL-to-English translation.",
    "MLS works with healthcare, education, business, and community organizations. Each service request is reviewed for setting, participant needs, timing, preparation materials, and appropriate interpreter fit before confirming next steps.",
  ],
  "/services": [
    "Choose between live on-site interpreting, video remote interpreting, and recorded ASL translation. Different settings require different planning, technology, preparation, and service approaches.",
    "MLS coordinates local Florida assignments and remote interpreting throughout the United States, subject to interpreter availability and whether the communication needs can be effectively met through the requested modality.",
  ],
  "/services/in-person-interpreting": [
    "In-person ASL-English interpreting can support medical appointments, school meetings, legal consultations, workplace discussions, conferences, and community events where the interpreter's physical presence is important.",
    "MLS reviews participants, location, preparation needs, required qualifications, visibility, travel, and possible team interpreting before confirming on-site coverage.",
  ],
  "/services/video-remote-interpreting": [
    "Video Remote Interpreting, or VRI, connects participants and a qualified ASL-English interpreter through live video. It may suit telehealth, virtual meetings, distributed teams, and other remote conversations.",
    "Effective VRI requires a reliable connection, clear audio, adequate video quality, appropriate framing, and a communication environment that supports signed language. An in-person interpreter may be more appropriate for some encounters.",
  ],
  "/services/video-remote-interpreting-nationwide": [
    "MLS provides video remote ASL-English interpreting for virtual appointments, telehealth, team meetings, training, and other appropriate encounters throughout the United States.",
    "Each request is reviewed for interpreter availability, platform accessibility, participant needs, time zone, and preparation before confirming service.",
  ],
  "/services/english-asl-translation": [
    "English-to-ASL translation transforms scripts, documents, policies, educational information, and training materials into recorded American Sign Language video content.",
    "MLS reviews audience, terminology, source material, recording format, and any agreed revision steps so the final ASL communication is natural and appropriate for its purpose.",
  ],
  "/services/asl-english-translation": [
    "ASL-to-English translation converts signed video into English text, captions, summaries, transcripts, or other agreed written formats.",
    "A project begins with a review of the source material, intended audience, required terminology, confidentiality, format, and scope of quality review.",
  ],
  "/locations/orlando": [
    "MLS supports Orlando organizations arranging ASL-English interpreting for scheduled healthcare encounters, business meetings, training, education, conferences, and community events.",
    "Interpreting requests are reviewed for assignment fit, credentials, logistics, preparation, and availability in Orlando and nearby Central Florida communities.",
  ],
  "/locations/ocala": [
    "MLS provides ASL-English interpreting coordination for organizations in Ocala, Marion County, and surrounding Florida communities.",
    "Services may support appointments, consultations, workplace meetings, school activities, and planned community access, depending on interpreter availability and assignment requirements.",
  ],
  "/locations/central-florida": [
    "MLS coordinates professional ASL-English interpreting across Central Florida, including Orlando and Ocala-area requests.",
    "Coverage for healthcare, educational, business, legal, and community settings is reviewed based on availability, required credentials, location, and the communication needs of everyone involved.",
  ],
  "/about": [
    "Miqueas Language Solutions is an ASL-English interpreting and translation provider focused on preparation, thoughtful coordination, professional judgment, and meaningful communication access.",
  ],
  "/contact": [
    "Organizations can request ASL-English interpreting or video translation by sharing the setting, requested date and time, location or platform, expected duration, and relevant preparation information. MLS reviews the request and follows up with availability and next steps.",
  ],
};

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function links(items) {
  return "<ul>" + items.map(([url, label]) =>
    '<li><a href="' + escapeHtml(url) + '">' + escapeHtml(label) + "</a></li>"
  ).join("") + "</ul>";
}

function extraContent(path) {
  const paragraphs = specificCopy[path] || [];
  return paragraphs.map((text) => "<p>" + escapeHtml(text) + "</p>").join("");
}

function safeArticleHtml(value) {
  // The blog HTML is authored in this repository. Omit executable and
  // media elements in the lightweight HTML fallback; keep headings and text.
  return String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<video\b[^>]*>[\s\S]*?<\/video>/gi, "")
    .replace(/<img\b[^>]*>/gi, "");
}

async function blogBody(slug) {
  const htmlPath = join(cwd(), "src", "content", "blog", slug + ".html");
  try {
    return safeArticleHtml(await readFile(htmlPath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  // Early articles were stored as inline String.raw HTML in blogPosts.js.
  // Keep these accessible without duplicating their content in a second file.
  const source = await readFile(join(cwd(), "src", "content", "blogPosts.js"), "utf8");
  const token = 'slug: "' + slug + '"';
  const from = source.indexOf(token);
  if (from < 0) return "";
  const nextPost = source.indexOf('\n  {\n    slug:', from + token.length);
  const post = source.slice(from, nextPost < 0 ? undefined : nextPost);
  const tick = String.fromCharCode(96);
  const marker = "html: String.raw" + tick;
  const offset = post.indexOf(marker);
  if (offset < 0) return "";
  const begin = offset + marker.length;
  const end = post.indexOf(tick, begin);
  return end < 0 ? "" : safeArticleHtml(post.slice(begin, end));
}

export async function staticFallbackForRoute(path, meta) {
  const title = meta.title.split("|")[0].trim();
  const description = meta.description || "";
  const isArticle = path.startsWith("/blog/");
  const article = isArticle ? await blogBody(path.slice("/blog/".length)) : "";
  const more = extraContent(path);
  const sections = isArticle
    ? '<article><h1>' + escapeHtml(title) + '</h1><p>' + escapeHtml(description) + '</p>' + article + '</article>'
    : '<article><h1>' + escapeHtml(title) + '</h1><p>' + escapeHtml(description) + '</p>' + more + '</article>';

  const servicesSection = (path === "/" || path === "/services" || path.startsWith("/locations/"))
    ? '<section><h2>ASL interpreting and translation services</h2>' + links(serviceLinks) + '</section>'
    : "";
  const areaSection = (path === "/" || path === "/services")
    ? '<section><h2>Service areas</h2>' + links(areaLinks) + '</section>'
    : "";
  const requestSection = path === "/contact"
    ? '<p>To request services, email <a href="mailto:m.stubbs@miqueaslanguagesolutions.com">m.stubbs@miqueaslanguagesolutions.com</a> or call <a href="tel:+13213798010">(321) 379-8010</a>.</p>'
    : '<p><a href="/contact">Request an interpreter or discuss a translation project</a></p>';

  return '<div class="mls-static-content" data-mls-seo-fallback="true">'
    + '<header><a href="/">Miqueas Language Solutions</a><nav aria-label="Main navigation">' + links(globalLinks) + '</nav></header>'
    + '<main>' + sections + servicesSection + areaSection + requestSection + '</main>'
    + '<footer>Bridging Perspectives. Delivering Understanding.</footer></div>';
}

export const fallbackStyles =
  "<style id=\"mls-seo-fallback-css\">"
  + ".mls-static-content{font:16px/1.65 system-ui,sans-serif;max-width:960px;padding:2rem;margin:auto;color:#202020;background:#fff}"
  + ".mls-static-content header,.mls-static-content section{margin-bottom:1.5rem}"
  + ".mls-static-content h1{font-size:2rem;line-height:1.2}"
  + ".mls-static-content h2{font-size:1.4rem;line-height:1.3;margin-top:1.5rem}"
  + ".mls-static-content a{color:#721100;text-decoration:underline}"
  + ".mls-static-content ul{padding-left:1.5rem}"
  + ".mls-static-content footer{margin-top:2rem}"
  + "</style>";
