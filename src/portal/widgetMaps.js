export function openStreetMapEmbedUrl(location) {
  if (!Number.isFinite(location?.latitude) || !Number.isFinite(location?.longitude)) return "";
  const latitudeSpan = 0.008;
  const longitudeSpan = Math.min(0.025, latitudeSpan / Math.max(Math.cos(location.latitude * Math.PI / 180), 0.3));
  const bounds = [
    location.longitude - longitudeSpan,
    location.latitude - latitudeSpan,
    location.longitude + longitudeSpan,
    location.latitude + latitudeSpan,
  ];
  const params = new URLSearchParams({
    bbox: bounds.join(","),
    layer: "mapnik",
    marker: `${location.latitude},${location.longitude}`,
  });
  return `https://www.openstreetmap.org/export/embed.html?${params}`;
}
