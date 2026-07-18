import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import { CloudSun, Clock3, ExternalLink, Loader2, LocateFixed, MapPinned, Newspaper, RefreshCcw } from "lucide-react";
import { Card, SectionHeader } from "./ui";
import { PORTAL_WIDGETS } from "./LayoutCustomizer";
import { getPortalTimeZone, timeZoneLabel } from "./timezones";

const WEATHER_LABELS = {
  0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Freezing fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow", 80: "Rain showers", 81: "Rain showers", 82: "Heavy showers",
  95: "Thunderstorms", 96: "Thunderstorms with hail", 99: "Severe thunderstorms",
};

async function widgetRequest(session, params) {
  const token = await session?.getToken();
  if (!token) throw new Error("Sign in is required.");
  const response = await fetch(`/api/portal-app?${new URLSearchParams({ action: "widgetData", ...params })}`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Widget data is unavailable.");
  return data;
}

function LocationButton({ loading, request }) {
  return <button type="button" onClick={request} disabled={loading} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#721100] px-4 text-sm font-black text-white disabled:opacity-50">{loading ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}Use current location</button>;
}

function ClockWidget({ now, timeZone }) {
  const date = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(now);
  const time = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short" }).format(now);
  return <Card><SectionHeader title="Date & time" text={timeZoneLabel(timeZone)} /><div className="mt-6 flex items-center gap-4"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#721100] text-white"><Clock3 size={24} /></span><div className="min-w-0"><p className="break-words text-2xl font-black text-slate-950">{time}</p><p className="mt-1 break-words text-sm font-bold text-slate-500">{date}</p></div></div></Card>;
}

function WeatherWidget({ weather, error, loading, requestLocation, refresh }) {
  const current = weather?.current;
  return <Card><SectionHeader title="Local weather" text={weather?.timeZone ? `Updated for ${weather.timeZone}` : "Share your location for current local conditions."} />{current ? <div className="mt-5"><div className="flex items-center justify-between gap-4"><div><p className="text-4xl font-black text-slate-950">{Math.round(current.temperature_2m)}°F</p><p className="mt-1 text-sm font-black text-slate-600">{WEATHER_LABELS[current.weather_code] || "Current conditions"}</p></div><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700"><CloudSun size={26} /></span></div><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-400">Feels like</p><p className="mt-1 font-black">{Math.round(current.apparent_temperature)}°F</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-400">Wind</p><p className="mt-1 font-black">{Math.round(current.wind_speed_10m)} mph</p></div></div><button type="button" onClick={refresh} disabled={loading} className="mt-4 inline-flex min-h-10 items-center gap-2 text-xs font-black text-[#721100]"><RefreshCcw size={14} className={loading ? "animate-spin" : ""} />Refresh weather</button></div> : <div className="mt-5"><LocationButton loading={loading} request={requestLocation} />{error && <p className="mt-3 text-xs font-bold leading-5 text-rose-700">{error}</p>}</div>}</Card>;
}

function MapWidget({ location, error, loading, requestLocation }) {
  const appleUrl = location ? `https://maps.apple.com/?ll=${location.latitude},${location.longitude}&q=Current%20Location` : "";
  const googleUrl = location ? `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}` : "";
  return <Card><SectionHeader title="GPS map" text="Open your current position in Apple Maps or Google Maps." />{location ? <div className="mt-5"><div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><MapPinned size={20} /></span><div className="min-w-0"><p className="font-black">Current location ready</p><p className="mt-1 break-all text-xs text-slate-500">{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p></div></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><a href={appleUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#721100] px-4 text-sm font-black text-white">Apple Maps <ExternalLink size={14} /></a><a href={googleUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-[#721100]">Google Maps <ExternalLink size={14} /></a></div></div> : <div className="mt-5"><LocationButton loading={loading} request={requestLocation} />{error && <p className="mt-3 text-xs font-bold leading-5 text-rose-700">{error}</p>}</div>}</Card>;
}

function NewsWidget({ news, error, loading, refresh }) {
  return <Card><SectionHeader title="Interpreter industry news" text="Recent interpreting and Deaf-community headlines. Open the original source to read more." action={<button type="button" onClick={refresh} disabled={loading} aria-label="Refresh industry news" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-[#721100]"><RefreshCcw size={15} className={loading ? "animate-spin" : ""} /></button>} /><div className="mt-5 space-y-3">{news.map((item) => <a key={`${item.url}-${item.title}`} href={item.url} target="_blank" rel="noopener noreferrer" className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#dd7d00]/50 hover:bg-white"><div className="flex items-start gap-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#721100]/10 text-[#721100]"><Newspaper size={16} /></span><span className="min-w-0"><span className="block break-words text-sm font-black leading-5 text-slate-900">{item.title}</span><span className="mt-1 block text-xs font-bold text-slate-500">{item.source}{item.publishedAt ? ` · ${new Date(item.publishedAt).toLocaleDateString()}` : ""}</span></span></div></a>)}{!loading && !news.length && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">News is temporarily unavailable.</p>}{error && <p className="text-xs font-bold leading-5 text-rose-700">{error}</p>}</div></Card>;
}

export default function PortalWidgets({ layout }) {
  const { session } = useSession();
  const enabled = useMemo(() => new Set(layout?.enabled_widgets || []), [layout?.enabled_widgets]);
  const order = useMemo(() => {
    const allowed = PORTAL_WIDGETS.map(([key]) => key);
    const saved = (layout?.widget_order || []).filter((key) => allowed.includes(key));
    return [...new Set([...saved, ...allowed])].filter((key) => enabled.has(key));
  }, [enabled, layout?.widget_order]);
  const [now, setNow] = useState(new Date());
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [news, setNews] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [newsError, setNewsError] = useState("");
  const timeZone = getPortalTimeZone();

  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  const loadWeather = useCallback(async (coords) => {
    if (!coords || !session) return;
    setWeatherLoading(true);
    try { const result = await widgetRequest(session, { type: "weather", latitude: coords.latitude, longitude: coords.longitude }); setWeather(result.weather); setLocationError(""); }
    catch (error) { setLocationError(error.message); }
    finally { setWeatherLoading(false); }
  }, [session]);
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return setLocationError("Location is not supported on this device.");
    setLocationLoading(true); setLocationError("");
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const next = { latitude: coords.latitude, longitude: coords.longitude };
      setLocation(next); setLocationLoading(false);
      if (enabled.has("weather")) await loadWeather(next);
    }, (error) => { setLocationLoading(false); setLocationError(error.code === 1 ? "Location permission was not granted. Enable Location for this site in your browser settings." : "Your current location could not be determined."); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 });
  }, [enabled, loadWeather]);
  const loadNews = useCallback(async () => {
    if (!session || !enabled.has("news")) return;
    setNewsLoading(true);
    try { const result = await widgetRequest(session, { type: "news" }); setNews(result.news || []); setNewsError(""); }
    catch (error) { setNewsError(error.message); }
    finally { setNewsLoading(false); }
  }, [enabled, session]);
  useEffect(() => { loadNews(); }, [loadNews]);
  if (!order.length) return null;
  const widgets = {
    clock: <ClockWidget now={now} timeZone={timeZone} />,
    weather: <WeatherWidget weather={weather} error={locationError} loading={locationLoading || weatherLoading} requestLocation={requestLocation} refresh={() => location ? loadWeather(location) : requestLocation()} />,
    map: <MapWidget location={location} error={locationError} loading={locationLoading} requestLocation={requestLocation} />,
    news: <NewsWidget news={news} error={newsError} loading={newsLoading} refresh={loadNews} />,
  };
  return <div className="grid gap-4 lg:grid-cols-2">{order.map((key) => <div key={key} className="min-w-0">{widgets[key]}</div>)}</div>;
}
