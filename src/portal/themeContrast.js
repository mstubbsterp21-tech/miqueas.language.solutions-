const WHITE = "#ffffff";
const INK = "#111827";

export function normalizeHex(value, fallback = "#721100") {
  const text = String(value || "").trim();
  const short = /^#([0-9a-f]{3})$/i.exec(text);
  if (short) return `#${short[1].split("").map((character) => character + character).join("")}`.toLowerCase();
  return /^#[0-9a-f]{6}$/i.test(text) ? text.toLowerCase() : fallback;
}

function rgb(value) {
  const color = normalizeHex(value, INK).slice(1);
  return [0, 2, 4].map((index) => Number.parseInt(color.slice(index, index + 2), 16));
}

function hex([red, green, blue]) {
  return `#${[red, green, blue].map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;
}

function mix(color, target, amount) {
  const start = rgb(color);
  const end = rgb(target);
  return hex(start.map((channel, index) => channel + (end[index] - channel) * amount));
}

function luminance(color) {
  const channels = rgb(color).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(first, second) {
  const lighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

export function readableText(background) {
  const color = normalizeHex(background);
  return contrastRatio(color, INK) >= contrastRatio(color, WHITE) ? INK : WHITE;
}

export function ensureContrast(color, background = WHITE, minimum = 4.5) {
  const foreground = normalizeHex(color, INK);
  const surface = normalizeHex(background, WHITE);
  if (contrastRatio(foreground, surface) >= minimum) return foreground;
  for (let step = 1; step <= 20; step += 1) {
    const amount = step / 20;
    const darker = mix(foreground, INK, amount);
    const lighter = mix(foreground, WHITE, amount);
    const darkRatio = contrastRatio(darker, surface);
    const lightRatio = contrastRatio(lighter, surface);
    if (darkRatio >= minimum || lightRatio >= minimum) return darkRatio >= lightRatio ? darker : lighter;
  }
  return contrastRatio(INK, surface) >= contrastRatio(WHITE, surface) ? INK : WHITE;
}

export function portalThemeTokens(personalization = {}) {
  const primary = normalizeHex(personalization.theme_primary, "#721100");
  const secondary = normalizeHex(personalization.theme_secondary, "#24130e");
  const accent = normalizeHex(personalization.theme_accent, "#dd7d00");
  const darkPrimary = ensureContrast(primary, WHITE, 7);
  const darkSecondary = ensureContrast(secondary, WHITE, 7);
  const darkSurface = darkSecondary;
  return {
    primary,
    secondary,
    accent,
    primaryInk: ensureContrast(primary, WHITE, 4.5),
    secondaryInk: ensureContrast(secondary, WHITE, 4.5),
    accentInk: ensureContrast(accent, WHITE, 4.5),
    onPrimary: readableText(primary),
    onSecondary: readableText(darkSecondary),
    onAccent: readableText(accent),
    heroStart: darkPrimary,
    heroEnd: darkSecondary,
    onHero: WHITE,
    sidebar: darkSecondary,
    onSidebar: WHITE,
    primaryOnDark: ensureContrast(primary, darkSurface, 4.5),
    accentOnDark: ensureContrast(accent, darkSurface, 4.5),
  };
}

export function portalThemeVariables(theme) {
  return {
    "--mls-primary": theme.primary,
    "--mls-secondary": theme.secondary,
    "--mls-accent": theme.accent,
    "--mls-primary-ink": theme.primaryInk,
    "--mls-secondary-ink": theme.secondaryInk,
    "--mls-accent-ink": theme.accentInk,
    "--mls-on-primary": theme.onPrimary,
    "--mls-on-secondary": theme.onSecondary,
    "--mls-on-accent": theme.onAccent,
    "--mls-hero-start": theme.heroStart,
    "--mls-hero-end": theme.heroEnd,
    "--mls-on-hero": theme.onHero,
    "--mls-sidebar": theme.sidebar,
    "--mls-on-sidebar": theme.onSidebar,
    "--mls-primary-on-dark": theme.primaryOnDark,
    "--mls-accent-on-dark": theme.accentOnDark,
  };
}
