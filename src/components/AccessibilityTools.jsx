import React, { useEffect, useRef, useState } from 'react';
import {
  Accessibility,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

const STORAGE_KEY = 'mls-accessibility-preferences-v1';
const TEXT_SCALES = [100, 112, 125, 140];

const DEFAULT_SETTINGS = {
  textScale: 0,
  highContrast: false,
  grayscale: false,
  readableFont: false,
  lineSpacing: false,
  letterSpacing: false,
  highlightLinks: false,
  largeCursor: false,
  strongFocus: false,
  reduceMotion: false,
  solidBackgrounds: false,
  hideImages: false,
  leftAlign: false,
  readingGuide: false,
};

const DATA_ATTRIBUTES = {
  highContrast: 'a11yHighContrast',
  grayscale: 'a11yGrayscale',
  readableFont: 'a11yReadableFont',
  lineSpacing: 'a11yLineSpacing',
  letterSpacing: 'a11yLetterSpacing',
  highlightLinks: 'a11yHighlightLinks',
  largeCursor: 'a11yLargeCursor',
  strongFocus: 'a11yStrongFocus',
  reduceMotion: 'a11yReduceMotion',
  solidBackgrounds: 'a11ySolidBackgrounds',
  hideImages: 'a11yHideImages',
  leftAlign: 'a11yLeftAlign',
  readingGuide: 'a11yReadingGuide',
};

const accessibilityStyles = `
  button[aria-label^="Accessibility: switch to"] {
    display: none !important;
  }

  .mls-a11y-skip-link {
    position: fixed;
    top: 0.75rem;
    left: 0.75rem;
    z-index: 130;
    transform: translateY(-180%);
    border: 3px solid #ffffff;
    border-radius: 0.75rem;
    background: #721100;
    color: #ffffff;
    padding: 0.75rem 1rem;
    font-weight: 800;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
  }

  .mls-a11y-skip-link:focus {
    transform: translateY(0);
    outline: 4px solid #ffd400;
    outline-offset: 3px;
  }

  html[data-a11y-text-scale="1"] { font-size: 112%; }
  html[data-a11y-text-scale="2"] { font-size: 125%; }
  html[data-a11y-text-scale="3"] { font-size: 140%; }

  html[data-a11y-readable-font="true"] body,
  html[data-a11y-readable-font="true"] button,
  html[data-a11y-readable-font="true"] input,
  html[data-a11y-readable-font="true"] select,
  html[data-a11y-readable-font="true"] textarea {
    font-family: Verdana, Arial, Helvetica, sans-serif !important;
  }

  html[data-a11y-line-spacing="true"] :where(p, li, label, blockquote, dd, dt) {
    line-height: 1.85 !important;
  }

  html[data-a11y-letter-spacing="true"] :where(body, button, input, select, textarea) {
    letter-spacing: 0.055em !important;
    word-spacing: 0.09em !important;
  }

  html[data-a11y-highlight-links="true"] :where(header, main, footer) a {
    border-radius: 0.25rem !important;
    background: #ffef7a !important;
    color: #111111 !important;
    text-decoration: underline 3px !important;
    text-underline-offset: 0.2em !important;
    box-shadow: 0 0 0 2px #111111 !important;
  }

  html[data-a11y-large-cursor="true"] body,
  html[data-a11y-large-cursor="true"] body * {
    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='38' height='38' viewBox='0 0 38 38'%3E%3Cpath d='M4 2L4 31L12 24L18 36L24 33L18 21L29 20Z' fill='white' stroke='black' stroke-width='2.4'/%3E%3C/svg%3E") 4 2, auto !important;
  }

  html[data-a11y-strong-focus="true"] *:focus-visible {
    outline: 4px solid #ffd400 !important;
    outline-offset: 4px !important;
    box-shadow: 0 0 0 7px rgba(0, 0, 0, 0.88) !important;
  }

  html[data-a11y-reduce-motion="true"] *,
  html[data-a11y-reduce-motion="true"] *::before,
  html[data-a11y-reduce-motion="true"] *::after {
    scroll-behavior: auto !important;
    animation-delay: 0s !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-delay: 0s !important;
    transition-duration: 0.01ms !important;
  }

  html[data-a11y-solid-backgrounds="true"] :where(header, main, footer) [class*="backdrop-blur"],
  html[data-a11y-solid-backgrounds="true"] :where(header, main, footer) [class*="bg-white/"],
  html[data-a11y-solid-backgrounds="true"] :where(header, main, footer) [class*="bg-black/"],
  html[data-a11y-solid-backgrounds="true"] :where(header, main, footer) [class*="bg-[rgba"] {
    -webkit-backdrop-filter: none !important;
    backdrop-filter: none !important;
    background-image: none !important;
    opacity: 1 !important;
  }

  html[data-a11y-hide-images="true"] :where(header, main, footer) :where(img, video, canvas, picture) {
    opacity: 0 !important;
  }

  html[data-a11y-grayscale="true"] :where(header, main, footer) {
    filter: grayscale(1) !important;
  }

  html[data-a11y-left-align="true"] :where(main, footer) :where(h1, h2, h3, h4, h5, h6, p, li, blockquote) {
    text-align: left !important;
  }

  html[data-a11y-high-contrast="true"] {
    --mls-burgundy: #ff6b4a;
    --mls-gold: #ffe600;
    --mls-charcoal: #ffffff;
    --mls-body: #ffffff;
    --mls-page: #000000;
    --mls-card: #000000;
    --mls-soft-gray: #111111;
    --mls-muted-surface: #111111;
    --mls-border: #ffffff;
    --mls-form-border: #ffffff;
  }

  html[data-a11y-high-contrast="true"] :where(body, header, main, footer),
  html[data-a11y-high-contrast="true"] :where(header, main, footer) :where(section, article, aside, nav, form, div) {
    border-color: #ffffff !important;
    background-color: #000000 !important;
    background-image: none !important;
    color: #ffffff !important;
  }

  html[data-a11y-high-contrast="true"] :where(header, main, footer) :where(h1, h2, h3, h4, h5, h6, p, span, label, li, strong, small) {
    color: #ffffff !important;
  }

  html[data-a11y-high-contrast="true"] :where(header, main, footer) a {
    color: #ffe600 !important;
    text-decoration: underline 2px !important;
    text-underline-offset: 0.18em !important;
  }

  html[data-a11y-high-contrast="true"] :where(header, main, footer) :where(input, textarea, select) {
    border: 2px solid #ffffff !important;
    background: #000000 !important;
    color: #ffffff !important;
  }

  .mls-a11y-reading-guide {
    position: fixed;
    top: calc(var(--mls-a11y-guide-y, 50vh) - 1.5rem);
    left: 0;
    z-index: 115;
    width: 100vw;
    height: 3rem;
    border-top: 2px solid rgba(255, 214, 0, 0.95);
    border-bottom: 2px solid rgba(255, 214, 0, 0.95);
    background: rgba(255, 235, 59, 0.18);
    pointer-events: none;
    mix-blend-mode: multiply;
  }

  :root[data-theme="dark"] .mls-a11y-reading-guide {
    background: rgba(255, 214, 0, 0.16);
    mix-blend-mode: screen;
  }

  @media (prefers-reduced-motion: reduce) {
    .mls-a11y-skip-link,
    [data-a11y-ui="true"] * {
      transition-duration: 0.01ms !important;
    }
  }
`;

function loadSettings() {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function FeatureToggle({ label, description, enabled, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className="flex min-h-20 w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4"
      style={{
        borderColor: enabled ? '#dd7d00' : 'rgba(128, 128, 128, 0.35)',
        backgroundColor: enabled ? 'rgba(221, 125, 0, 0.11)' : 'transparent',
      }}
    >
      <span className="min-w-0">
        <span className="block text-sm font-extrabold">{label}</span>
        <span className="mt-1 block text-xs leading-5 opacity-75">{description}</span>
      </span>
      <span
        aria-hidden="true"
        className="relative inline-flex h-7 w-12 shrink-0 rounded-full border transition"
        style={{
          borderColor: enabled ? '#dd7d00' : 'rgba(128, 128, 128, 0.45)',
          backgroundColor: enabled ? '#721100' : 'rgba(128, 128, 128, 0.2)',
        }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition"
          style={{ left: enabled ? '1.45rem' : '0.18rem' }}
        />
      </span>
    </button>
  );
}

export default function AccessibilityTools() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const [theme, setTheme] = useState(() => {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.dataset.theme
      || window.localStorage.getItem('mls-theme')
      || 'light';
  });
  const [announcement, setAnnouncement] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const speechRef = useRef(null);

  const isDark = theme === 'dark';
  const panelBackground = isDark ? '#18110f' : '#ffffff';
  const panelText = isDark ? '#fff8f0' : '#292321';
  const panelMuted = isDark ? '#cdbfb5' : '#625953';
  const panelBorder = isDark ? 'rgba(221, 125, 0, 0.34)' : '#d8cbc0';
  const panelSurface = isDark ? '#241815' : '#f8f4f0';
  const panelAccent = isDark ? '#ffb23f' : '#8a3f00';

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.a11yTextScale = String(settings.textScale);

    Object.entries(DATA_ATTRIBUTES).forEach(([settingName, datasetName]) => {
      if (settings[settingName]) {
        root.dataset[datasetName] = 'true';
      } else {
        delete root.dataset[datasetName];
      }
    });

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const nextTheme = root.dataset.theme;
      if (nextTheme === 'dark' || nextTheme === 'light') {
        setTheme(nextTheme);
      }
    });

    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.altKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setOpen((current) => !current);
      }

      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handlePanelKeys = (event) => {
      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handlePanelKeys);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handlePanelKeys);
      previousFocusRef.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!settings.readingGuide) return undefined;

    const updateGuide = (event) => {
      document.documentElement.style.setProperty('--mls-a11y-guide-y', `${event.clientY}px`);
    };

    window.addEventListener('pointermove', updateGuide, { passive: true });
    return () => window.removeEventListener('pointermove', updateGuide);
  }, [settings.readingGuide]);

  useEffect(() => () => {
    if (speechRef.current && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const announce = (message) => {
    setAnnouncement('');
    window.setTimeout(() => setAnnouncement(message), 20);
  };

  const updateSetting = (name, value, label) => {
    setSettings((current) => ({ ...current, [name]: value }));
    announce(`${label} ${value ? 'enabled' : 'disabled'}.`);
  };

  const toggleSetting = (name, label) => {
    const nextValue = !settings[name];
    updateSetting(name, nextValue, label);
  };

  const changeTextScale = (direction) => {
    const nextScale = Math.min(TEXT_SCALES.length - 1, Math.max(0, settings.textScale + direction));
    setSettings((current) => ({ ...current, textScale: nextScale }));
    announce(`Text size set to ${TEXT_SCALES[nextScale]} percent.`);
  };

  const changeTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    const websiteThemeButton = document.querySelector('button[aria-label^="Accessibility: switch to"]');

    if (websiteThemeButton) {
      websiteThemeButton.click();
    } else {
      document.documentElement.dataset.theme = nextTheme;
      document.documentElement.style.colorScheme = nextTheme;
      window.localStorage.setItem('mls-theme', nextTheme);
    }

    setTheme(nextTheme);
    announce(`${nextTheme === 'dark' ? 'Dark' : 'Light'} mode enabled.`);
  };

  const skipToMain = (event) => {
    event.preventDefault();
    const main = document.querySelector('main');
    if (!main) return;

    if (!main.hasAttribute('tabindex')) {
      main.setAttribute('tabindex', '-1');
    }
    main.focus({ preventScroll: true });
    main.scrollIntoView({ behavior: settings.reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const toggleReadAloud = () => {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      announce('Read aloud is not supported by this browser.');
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      speechRef.current = null;
      setSpeaking(false);
      announce('Reading stopped.');
      return;
    }

    const pageText = document.querySelector('main')?.innerText?.trim();
    if (!pageText) {
      announce('There is no page text available to read.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(pageText);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onend = () => {
      speechRef.current = null;
      setSpeaking(false);
      announce('Reading finished.');
    };
    utterance.onerror = () => {
      speechRef.current = null;
      setSpeaking(false);
      announce('Reading stopped because the browser could not continue.');
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
    announce('Reading the current page aloud.');
  };

  const resetAll = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    speechRef.current = null;
    setSpeaking(false);
    setSettings(DEFAULT_SETTINGS);

    if (isDark) {
      changeTheme();
    }

    announce('All accessibility preferences were reset.');
  };

  const featureGroups = [
    {
      title: 'Reading and text',
      items: [
        ['readableFont', 'Readable font', 'Use a simpler, highly legible font throughout the site.'],
        ['lineSpacing', 'More line spacing', 'Add breathing room between lines of text.'],
        ['letterSpacing', 'More letter spacing', 'Increase spacing between letters and words.'],
        ['leftAlign', 'Left-align text', 'Reduce centered text for easier scanning.'],
        ['highlightLinks', 'Highlight links', 'Underline links and place them on a high-visibility background.'],
        ['readingGuide', 'Reading guide', 'Follow the pointer with a horizontal reading band.'],
      ],
    },
    {
      title: 'Display',
      items: [
        ['highContrast', 'High contrast', 'Switch page content to a strong black, white, and yellow palette.'],
        ['grayscale', 'Grayscale', 'Remove color from page content to reduce visual distraction.'],
        ['solidBackgrounds', 'Solid backgrounds', 'Remove transparent and blurred surfaces.'],
        ['hideImages', 'Hide images', 'Visually hide photos and videos while keeping the page layout.'],
      ],
    },
    {
      title: 'Navigation and motion',
      items: [
        ['strongFocus', 'Strong keyboard focus', 'Make the currently focused control much easier to see.'],
        ['largeCursor', 'Large cursor', 'Use a larger pointer across the website.'],
        ['reduceMotion', 'Reduce motion', 'Stop animations, smooth scrolling, and long transitions.'],
      ],
    },
  ];

  return (
    <>
      <style>{accessibilityStyles}</style>
      <a href="#main-content" onClick={skipToMain} className="mls-a11y-skip-link" data-a11y-ui="true">
        Skip to main content
      </a>

      {settings.readingGuide ? <div className="mls-a11y-reading-guide" aria-hidden="true" data-a11y-ui="true" /> : null}

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open accessibility tools"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="mls-accessibility-panel"
        className="fixed bottom-5 right-5 z-[100] inline-flex min-h-14 items-center gap-3 rounded-full border-2 border-white px-3 py-2.5 text-sm font-black text-white shadow-2xl transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd400] md:bottom-6 md:right-6 md:px-4"
        style={{ backgroundColor: '#721100', boxShadow: '0 14px 40px rgba(0,0,0,0.28)' }}
        data-a11y-ui="true"
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15" aria-hidden="true">
          <Accessibility size={21} />
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block">Accessibility</span>
          <span className="block text-[11px] font-bold opacity-80">Open tools</span>
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center md:items-stretch md:justify-end" data-a11y-ui="true">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" aria-hidden="true" onClick={() => setOpen(false)} />
          <section
            ref={panelRef}
            id="mls-accessibility-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mls-accessibility-title"
            className="relative m-3 flex max-h-[92vh] w-[calc(100%-1.5rem)] max-w-xl flex-col overflow-hidden rounded-3xl border shadow-2xl md:m-0 md:h-full md:max-h-none md:w-full md:max-w-md md:rounded-none md:rounded-l-3xl"
            style={{ backgroundColor: panelBackground, color: panelText, borderColor: panelBorder }}
          >
            <div className="flex items-start justify-between gap-4 border-b px-5 py-5" style={{ borderColor: panelBorder }}>
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold text-white" style={{ backgroundColor: '#721100' }}>
                  <Accessibility size={15} aria-hidden="true" />
                  Accessibility tools
                </div>
                <h2 id="mls-accessibility-title" className="text-2xl font-black tracking-tight">Make the site work for you</h2>
                <p className="mt-1 text-sm leading-6" style={{ color: panelMuted }}>Preferences are saved automatically on this device.</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close accessibility tools"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd400]"
                style={{ borderColor: panelBorder, backgroundColor: panelSurface }}
              >
                <X size={21} aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div className="space-y-6">
                <section aria-labelledby="appearance-heading">
                  <h3 id="appearance-heading" className="mb-3 text-xs font-black uppercase tracking-[0.18em]" style={{ color: panelAccent }}>Appearance</h3>
                  <button
                    type="button"
                    onClick={changeTheme}
                    className="flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd400]"
                    style={{ borderColor: panelBorder, backgroundColor: panelSurface }}
                  >
                    <span>
                      <span className="block text-sm font-extrabold">{isDark ? 'Use light mode' : 'Use dark mode'}</span>
                      <span className="mt-1 block text-xs leading-5" style={{ color: panelMuted }}>Change the overall color theme.</span>
                    </span>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ backgroundColor: '#721100' }} aria-hidden="true">
                      {isDark ? <Sun size={19} /> : <Moon size={19} />}
                    </span>
                  </button>
                </section>

                <section aria-labelledby="text-size-heading">
                  <h3 id="text-size-heading" className="mb-3 text-xs font-black uppercase tracking-[0.18em]" style={{ color: panelAccent }}>Text size</h3>
                  <div className="flex items-center justify-between gap-4 rounded-2xl border p-3" style={{ borderColor: panelBorder, backgroundColor: panelSurface }}>
                    <button
                      type="button"
                      onClick={() => changeTextScale(-1)}
                      disabled={settings.textScale === 0}
                      aria-label="Decrease text size"
                      className="inline-flex h-12 w-12 items-center justify-center rounded-xl border disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd400]"
                      style={{ borderColor: panelBorder }}
                    >
                      <Minus size={20} aria-hidden="true" />
                    </button>
                    <div className="text-center">
                      <div className="text-2xl font-black">{TEXT_SCALES[settings.textScale]}%</div>
                      <div className="text-xs" style={{ color: panelMuted }}>Current scale</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => changeTextScale(1)}
                      disabled={settings.textScale === TEXT_SCALES.length - 1}
                      aria-label="Increase text size"
                      className="inline-flex h-12 w-12 items-center justify-center rounded-xl border disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd400]"
                      style={{ borderColor: panelBorder }}
                    >
                      <Plus size={20} aria-hidden="true" />
                    </button>
                  </div>
                </section>

                {featureGroups.map((group) => (
                  <section key={group.title} aria-label={group.title}>
                    <h3 className="mb-3 text-xs font-black uppercase tracking-[0.18em]" style={{ color: panelAccent }}>{group.title}</h3>
                    <div className="grid gap-3">
                      {group.items.map(([name, label, description]) => (
                        <FeatureToggle
                          key={name}
                          label={label}
                          description={description}
                          enabled={settings[name]}
                          onToggle={() => toggleSetting(name, label)}
                        />
                      ))}
                    </div>
                  </section>
                ))}

                <section aria-labelledby="audio-heading">
                  <h3 id="audio-heading" className="mb-3 text-xs font-black uppercase tracking-[0.18em]" style={{ color: panelAccent }}>Page reader</h3>
                  <button
                    type="button"
                    onClick={toggleReadAloud}
                    className="flex min-h-16 w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd400]"
                    style={{ borderColor: panelBorder, backgroundColor: panelSurface }}
                  >
                    <span>
                      <span className="block text-sm font-extrabold">{speaking ? 'Stop reading' : 'Read this page aloud'}</span>
                      <span className="mt-1 block text-xs leading-5" style={{ color: panelMuted }}>Use your browser's speech feature for the current page.</span>
                    </span>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ backgroundColor: speaking ? '#464747' : '#721100' }} aria-hidden="true">
                      {speaking ? <VolumeX size={19} /> : <Volume2 size={19} />}
                    </span>
                  </button>
                </section>
              </div>
            </div>

            <div className="border-t px-5 py-4" style={{ borderColor: panelBorder, backgroundColor: panelSurface }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5" style={{ color: panelMuted }}>
                  Keyboard: <strong>Alt + A</strong> opens this panel. <strong>Esc</strong> closes it.
                </p>
                <button
                  type="button"
                  onClick={resetAll}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffd400]"
                  style={{ borderColor: '#721100', color: isDark ? '#ffffff' : '#721100' }}
                >
                  <RotateCcw size={17} aria-hidden="true" />
                  Reset all
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
    </>
  );
}
