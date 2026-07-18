import { send, signedInUser } from "./_shared/ops-v2-core.js";

const FALLBACK_NEWS = [
  { title: "Registry of Interpreters for the Deaf news", source: "RID", url: "https://rid.org/news/" },
  { title: "National Association of the Deaf news", source: "NAD", url: "https://www.nad.org/category/news/" },
  { title: "CASLI updates and announcements", source: "CASLI", url: "https://www.casli.org/" },
];

function decodeXml(value = "") {
  return String(value)
    .replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "")
    .replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<").replaceAll("&gt;", ">").trim();
}

function tag(item, name) {
  return decodeXml(item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"))?.[1] || "");
}

async function industryNews() {
  const query = encodeURIComponent('("sign language interpreter" OR ASL interpreting OR Deaf interpreting) when:30d');
  try {
    const response = await fetch(`https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`, {
      headers: { "user-agent": "Miqueas-MLS-Portal/1.0" },
    });
    if (!response.ok) throw new Error(`News source returned ${response.status}.`);
    const xml = await response.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 8).map((match) => {
      const value = match[1];
      return {
        title: tag(value, "title"),
        source: tag(value, "source") || "Industry news",
        url: tag(value, "link"),
        publishedAt: tag(value, "pubDate") || null,
      };
    }).filter((item) => item.title && item.url.startsWith("https://"));
    return items.length ? items : FALLBACK_NEWS;
  } catch (error) {
    console.warn("MLS widget news refresh failed", error);
    return FALLBACK_NEWS;
  }
}

async function weather(search) {
  const latitude = Number(search.get("latitude"));
  const longitude = Number(search.get("longitude"));
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error("Valid latitude and longitude are required.");
  }
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation,is_day",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "auto",
  });
  const response = await fetch(url, { headers: { "user-agent": "Miqueas-MLS-Portal/1.0" } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.current) throw new Error(data.reason || "Current weather is unavailable.");
  return {
    current: data.current,
    units: data.current_units || {},
    timeZone: data.timezone || null,
    location: { latitude, longitude },
  };
}

export default async function handler(req, res) {
  try {
    const user = await signedInUser(req);
    if (!user) return send(res, 401, { error: "Sign in is required." });
    if (req.method !== "GET") return send(res, 405, { error: "Use GET." });
    const search = new URL(req.url, "https://miqueaslanguagesolutions.com").searchParams;
    const type = search.get("type") || "news";
    res.setHeader("Cache-Control", type === "news" ? "private, max-age=300" : "private, max-age=120");
    if (type === "news") return send(res, 200, { news: await industryNews() });
    if (type === "weather") return send(res, 200, { weather: await weather(search) });
    return send(res, 400, { error: "Unknown widget type." });
  } catch (error) {
    console.error("MLS widget error", error);
    return send(res, 500, { error: error.message || "Widget data is unavailable." });
  }
}
