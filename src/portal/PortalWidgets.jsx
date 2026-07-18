import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import {
  CalendarDays, Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun,
  Clock3, Droplets, ExternalLink, Gauge, Globe2, Loader2, LocateFixed, MapPinned, Moon,
  Newspaper, RefreshCcw, Sun, Timer, Wind,
} from "lucide-react";
import { Card, SectionHeader } from "./ui";
import { PORTAL_WIDGETS } from "./LayoutCustomizer";
import { getPortalTimeZone, timeZoneLabel } from "./timezones";
import { openStreetMapEmbedUrl } from "./widgetMaps";

const WEATHER_LABELS = {
  0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Freezing fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow", 80: "Rain showers", 81: "Rain showers", 82: "Heavy showers",
  95: "Thunderstorms", 96: "Thunderstorms with hail", 99: "Severe thunderstorms",
};

const NEWS_VISUALS = [
  "from-[#721100] to-[#b52b16]",
  "from-[#dd7d00] to-[#f2b13d]",
  "from-[#1f5964] to-[#3d8996]",
  "from-[#46304f] to-[#75557e]",
];

function weatherVisual(code, isDay = 1) {
  if (code >= 95) return { Icon: CloudLightning, gradient: "from-slate-800 via-violet-800 to-slate-700", accent: "text-amber-300" };
  if (code >= 71 && code <= 77) return { Icon: CloudSnow, gradient: "from-sky-500 via-sky-300 to-slate-200", accent: "text-white" };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { Icon: CloudRain, gradient: "from-sky-700 via-blue-500 to-slate-400", accent: "text-sky-100" };
  if (code === 45 || code === 48) return { Icon: CloudFog, gradient: "from-slate-500 via-slate-400 to-slate-300", accent: "text-white" };
  if (code === 3) return { Icon: Cloud, gradient: "from-slate-600 via-slate-400 to-slate-300", accent: "text-white" };
  if (code === 1 || code === 2) return { Icon: CloudSun, gradient: "from-sky-500 via-sky-300 to-amber-200", accent: "text-white" };
  return isDay ? { Icon: Sun, gradient: "from-sky-500 via-sky-300 to-amber-300", accent: "text-amber-100" } : { Icon: Moon, gradient: "from-slate-950 via-indigo-900 to-slate-700", accent: "text-amber-200" };
}

function ForecastIcon({ code, size = 20 }) {
  const { Icon } = weatherVisual(code);
  return <Icon size={size} />;
}

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
  const day = new Intl.DateTimeFormat("en-US", { timeZone, day: "numeric" }).format(now);
  const month = new Intl.DateTimeFormat("en-US", { timeZone, month: "short" }).format(now);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" }).format(now);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" }).formatToParts(now);
  const part = (type) => Number(parts.find((item) => item.type === type)?.value || 0);
  const localDate = new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
  const yearStart = new Date(Date.UTC(part("year"), 0, 1));
  const dayOfYear = Math.floor((localDate - yearStart) / 864e5) + 1;
  const weekDate = new Date(localDate);
  weekDate.setUTCDate(weekDate.getUTCDate() + 4 - (weekDate.getUTCDay() || 7));
  const weekStart = new Date(Date.UTC(weekDate.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((weekDate - weekStart) / 864e5) + 1) / 7);
  const secondsToday = part("hour") * 3600 + part("minute") * 60 + part("second");
  const dayProgress = Math.min(100, Math.max(0, (secondsToday / 86400) * 100));
  const hoursRemaining = Math.max(0, 24 - secondsToday / 3600);
  const quarter = Math.ceil(part("month") / 3);
  return <Card className="overflow-hidden"><SectionHeader title="Date & Time" text={timeZoneLabel(timeZone)} /><div className="relative mt-5 overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-[#721100] via-[#98200d] to-[#dd7d00] p-5 text-white sm:p-6"><span className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" /><span className="absolute -bottom-12 left-16 h-32 w-32 rounded-full bg-[#f7c876]/20" /><div className="relative flex items-center gap-4 sm:gap-5"><div className="w-20 shrink-0 overflow-hidden rounded-2xl bg-white text-center shadow-xl sm:w-24"><p className="bg-[#24130e] py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-[#f6b34c] sm:py-2">{month}</p><p className="py-2 text-3xl font-black text-[#721100] sm:py-3 sm:text-4xl">{day}</p></div><div className="min-w-0"><div className="flex items-center gap-2 text-white/65"><Clock3 size={15} /><span className="text-[10px] font-black uppercase tracking-[.16em]">Local time</span></div><p className="mt-1 break-words text-2xl font-black sm:text-3xl">{time}</p><p className="mt-1 text-sm font-bold text-white/75">{weekday}</p></div></div><div className="relative mt-5"><div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[.12em] text-white/70"><span className="inline-flex items-center gap-1.5"><Timer size={13} />Day progress</span><span>{Math.round(dayProgress)}% · {hoursRemaining.toFixed(1)}h remaining</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-black/20"><div className="h-full rounded-full bg-[#f6b34c] transition-[width] duration-500" style={{ width: `${dayProgress}%` }} /></div></div></div><div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-2xl bg-slate-50 p-3"><CalendarDays size={16} className="text-[#dd7d00]" /><p className="mt-2 text-[10px] font-black uppercase tracking-[.1em] text-slate-400">Week</p><p className="mt-1 text-lg font-black text-slate-900">{weekNumber}</p></div><div className="rounded-2xl bg-slate-50 p-3"><Gauge size={16} className="text-[#dd7d00]" /><p className="mt-2 text-[10px] font-black uppercase tracking-[.1em] text-slate-400">Day of year</p><p className="mt-1 text-lg font-black text-slate-900">{dayOfYear}</p></div><div className="rounded-2xl bg-slate-50 p-3"><Globe2 size={16} className="text-[#dd7d00]" /><p className="mt-2 text-[10px] font-black uppercase tracking-[.1em] text-slate-400">Quarter</p><p className="mt-1 text-lg font-black text-slate-900">Q{quarter}</p></div></div><p className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500"><CalendarDays size={14} className="text-[#dd7d00]" />{date}</p></Card>;
}

function WeatherWidget({ weather, error, loading, requestLocation, refresh }) {
  const current = weather?.current;
  const visual = current ? weatherVisual(current.weather_code, current.is_day) : null;
  const WeatherIcon = visual?.Icon || CloudSun;
  const forecast = weather?.daily?.time?.slice(1, 4).map((date, index) => ({
    date,
    code: weather.daily.weather_code?.[index + 1],
    high: weather.daily.temperature_2m_max?.[index + 1],
    low: weather.daily.temperature_2m_min?.[index + 1],
  })) || [];
  return <Card><SectionHeader title="Weather" text={weather?.timeZone ? `Updated for ${weather.timeZone}` : "Share your location for current local conditions."} />{current ? <div className="mt-5"><div className={`relative overflow-hidden rounded-[1.6rem] bg-gradient-to-br ${visual.gradient} p-5 text-white`}><span className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/15" /><WeatherIcon size={86} strokeWidth={1.35} className={`absolute -right-1 top-2 ${visual.accent} opacity-90`} /><div className="relative"><p className="text-5xl font-black tracking-tight">{Math.round(current.temperature_2m)}°</p><p className="mt-1 text-sm font-black text-white/90">{WEATHER_LABELS[current.weather_code] || "Current conditions"}</p><div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-white/80"><span className="inline-flex items-center gap-1.5"><Droplets size={14} />{Number(current.precipitation || 0).toFixed(1)} in</span><span className="inline-flex items-center gap-1.5"><Wind size={14} />{Math.round(current.wind_speed_10m)} mph</span><span>Feels {Math.round(current.apparent_temperature)}°</span></div></div></div>{forecast.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2">{forecast.map((item) => <div key={item.date} className="rounded-2xl bg-slate-50 p-3 text-center"><p className="text-[10px] font-black uppercase tracking-[.1em] text-slate-400">{new Date(`${item.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" })}</p><span className="mx-auto mt-2 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700"><ForecastIcon code={item.code} size={18} /></span><p className="mt-2 text-xs font-black text-slate-800">{Math.round(item.high)}° <span className="text-slate-400">{Math.round(item.low)}°</span></p></div>)}</div>}<button type="button" onClick={refresh} disabled={loading} className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-black text-[#721100]"><RefreshCcw size={14} className={loading ? "animate-spin" : ""} />Refresh weather</button></div> : <div className="mt-5"><div className="mb-4 flex h-36 items-center justify-center overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-sky-100 to-amber-100"><CloudSun size={72} strokeWidth={1.25} className="text-sky-600" /></div><LocationButton loading={loading} request={requestLocation} />{error && <p className="mt-3 text-xs font-bold leading-5 text-rose-700">{error}</p>}</div>}</Card>;
}

function MapWidget({ location, error, loading, requestLocation }) {
  const appleUrl = location ? `https://maps.apple.com/?ll=${location.latitude},${location.longitude}&q=Current%20Location` : "";
  const googleUrl = location ? `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}` : "";
  const embedUrl = openStreetMapEmbedUrl(location);
  return <Card><SectionHeader title="Map" text="A live map centered on your current location." />{location ? <div className="mt-5"><div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"><iframe key={embedUrl} src={embedUrl} title="Map centered on your current location" loading="lazy" referrerPolicy="no-referrer" allowFullScreen className="h-72 w-full border-0" /></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><MapPinned size={18} /></span><div className="min-w-0"><p className="text-sm font-black">Current location</p><p className="mt-0.5 break-all text-xs text-slate-500">{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p></div></div><button type="button" onClick={requestLocation} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-black text-[#721100] disabled:opacity-50">{loading ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}Refresh location</button></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><a href={appleUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#721100] px-4 text-sm font-black text-white">Open in Apple Maps <ExternalLink size={14} /></a><a href={googleUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-[#721100]">Open in Google Maps <ExternalLink size={14} /></a></div>{error && <p className="mt-3 text-xs font-bold leading-5 text-rose-700">{error}</p>}</div> : <div className="mt-5"><LocationButton loading={loading} request={requestLocation} />{error && <p className="mt-3 text-xs font-bold leading-5 text-rose-700">{error}</p>}</div>}</Card>;
}

function NewsWidget({ news, error, loading, refresh }) {
  return <Card><SectionHeader title="News" text="Recent interpreting and Deaf-community headlines. Four stories are visible at a time; scroll for more." action={<button type="button" onClick={refresh} disabled={loading} aria-label="Refresh news" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-[#721100]"><RefreshCcw size={15} className={loading ? "animate-spin" : ""} /></button>} /><div className="mt-5 max-h-[56.25rem] overflow-y-auto overscroll-contain pr-1 sm:max-h-[27.75rem] sm:pr-2"><div className="grid gap-3 sm:grid-cols-2">{news.map((item, index) => <a key={`${item.url}-${item.title}`} href={item.url} target="_blank" rel="noopener noreferrer" className="group flex h-[13.5rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-[#dd7d00]/50 hover:shadow-lg"><span className={`relative flex h-28 shrink-0 items-end overflow-hidden bg-gradient-to-br ${NEWS_VISUALS[index % NEWS_VISUALS.length]} p-3 text-white`}>{item.imageUrl && <img src={item.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-luminosity" />}<span className="absolute -right-4 -top-5 h-20 w-20 rounded-full bg-white/15" /><Newspaper size={54} strokeWidth={1.2} className="absolute right-3 top-3 text-white/25" /><span className="relative rounded-full bg-black/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.1em] backdrop-blur-sm">{item.source || "News"}</span></span><span className="flex min-h-0 flex-1 flex-col p-4"><span className="line-clamp-2 block break-words text-sm font-black leading-5 text-slate-900 group-hover:text-[#721100]">{item.title}</span><span className="mt-auto flex items-center justify-between gap-2 pt-2 text-[10px] font-bold text-slate-400"><span>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "Latest update"}</span><ExternalLink size={13} /></span></span></a>)}{loading && !news.length && [0, 1, 2, 3].map((item) => <div key={item} className="h-[13.5rem] overflow-hidden rounded-2xl border border-slate-200"><div className="h-28 animate-pulse bg-slate-200" /><div className="space-y-2 p-4"><div className="h-3 animate-pulse rounded bg-slate-200" /><div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" /></div></div>)}{!loading && !news.length && <div className="sm:col-span-2"><p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">News is temporarily unavailable.</p></div>}{error && <p className="text-xs font-bold leading-5 text-rose-700 sm:col-span-2">{error}</p>}</div></div></Card>;
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
  const columns = [order.filter((_, index) => index % 2 === 0), order.filter((_, index) => index % 2 === 1)];
  return <div className="grid gap-4 lg:grid-cols-2 lg:items-start">{columns.map((keys, columnIndex) => <div key={columnIndex} className="contents lg:block lg:space-y-4">{keys.map((key) => <div key={key} className="min-w-0" style={{ order: order.indexOf(key) }}>{widgets[key]}</div>)}</div>)}</div>;
}
