import React, { useEffect, useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import ResourcesClients from "./pages/ResourcesClients";
import ResourcesInterpreters from "./pages/ResourcesInterpreters";
import DeafHardOfHearing from "./pages/DeafHardOfHearing";
import PoliciesLayout from "./pages/PoliciesLayout";
import PoliciesClients from "./pages/PoliciesClients";
import PoliciesConsumers from "./pages/PoliciesConsumers";
import PoliciesInterpreters from "./pages/PoliciesInterpreters";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Accessibility from "./pages/Accessibility";
import InterpreterCommunity from "./pages/InterpreterCommunity";
import InterpreterNetworkForm from "./components/InterpreterNetworkFormOptional";
import Login from "./pages/Login";
import InterpreterPortal from "./pages/InterpreterPortal";
import AdminInterpreters from "./pages/AdminInterpreters";
import AdminInterpreterProfile from "./pages/AdminInterpreterProfile";
import AuthStatus from "./components/AuthStatus";
import PortalSetupNotice from "./components/PortalSetupNotice";
import RequirePortalAuth from "./components/RequirePortalAuth";
import { isClerkConfigured } from "./lib/env";
import logo from "./logo.png";
import { FaInstagram, FaLinkedinIn, FaFacebookF } from "react-icons/fa";
import { Accessibility as AccessibilityIcon, Mail, Moon, Phone, Sun } from "lucide-react";

const lightPalette = {
  burgundy: "#721100",
  gold: "#dd7d00",
  charcoal: "#464747",
  white: "#ffffff",
  softGray: "#f5f5f5",
  border: "#d1c6bc",
  body: "#444444",
};

const darkPalette = {
  burgundy: "#721100",
  gold: "#dd7d00",
  charcoal: "#f7f3ef",
  white: "#15100e",
  softGray: "#211714",
  border: "rgba(221, 125, 0, 0.24)",
  body: "#efe7df",
};

const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";
  const savedTheme = window.localStorage.getItem("mls-theme");
  if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const flridLogoUrl = "/FRID-Logo-wText-2.png";
const ridCredlyBadgeUrl = "https://images.credly.com/size/680x680/images/eec9e878-8dcd-48fe-b57e-7e4d55637755/image.png";
const ridCredlyBadgeLink = "https://www.credly.com/badges/a160083c-07d6-4c48-adb3-6ad7e0d7b8d5/wallet";

const navItems = [
  { path: "/", label: "Home" },
  { path: "/services", label: "Services" },
  { path: "/about", label: "About" },
  { path: "/blog", label: "Blog" },
  { path: "/clients", label: "Clients" },
  { path: "/interpreters", label: "Interpreters" },
  { path: "/deaf-and-hard-of-hearing", label: "Deaf & Hard of Hearing" },
];

const socialItems = [
  { href: "https://www.instagram.com/miqueas.language.solutions/", label: "Instagram", Icon: FaInstagram },
  { href: "https://www.facebook.com/profile.php?id=61573286078153", label: "Facebook", Icon: FaFacebookF },
  { href: "https://www.linkedin.com/company/miqueas-language-solutions/?viewAsMember=true", label: "LinkedIn", Icon: FaLinkedinIn },
];

const legalItems = [
  { path: "/policies/clients", label: "Client Policies" },
  { path: "/policies/consumers", label: "Consumer Access" },
  { path: "/policies/interpreters", label: "Interpreter Policies" },
  { path: "/privacy", label: "Privacy Policy" },
  { path: "/terms", label: "Terms & Conditions" },
  { path: "/accessibility", label: "Accessibility" },
];

const footerServiceItems = [
  { path: "/services/in-person-interpreting", label: "In-Person Interpreting" },
  { path: "/services/video-remote-interpreting", label: "Video Remote Interpreting" },
  { path: "/services/english-asl-translation", label: "English → ASL Translation" },
  { path: "/services/asl-english-translation", label: "ASL → English Translation" },
];

function AccessibilityOverlay({ theme, onToggle, palette }) {
  const isDark = theme === "dark";
  const ModeIcon = isDark ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Accessibility: switch to ${isDark ? "light" : "dark"} mode`}
      className="fixed bottom-5 right-5 z-[70] inline-flex items-center gap-3 rounded-full border px-4 py-3 text-sm font-black shadow-2xl backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(0,0,0,0.22)] focus:outline-none focus:ring-4 md:bottom-6 md:right-6"
      style={{ borderColor: palette.border, color: palette.charcoal, backgroundColor: palette.white, boxShadow: "0 12px 34px rgba(0,0,0,0.18)" }}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white" style={{ backgroundColor: lightPalette.burgundy }}>
        <AccessibilityIcon size={18} />
      </span>
      <span className="hidden text-left leading-tight sm:block">
        <span className="block">Accessibility</span>
        <span className="block text-[11px] font-bold opacity-75">{isDark ? "Light mode" : "Dark mode"}</span>
      </span>
      <ModeIcon size={17} style={{ color: palette.gold }} />
    </button>
  );
}

function BrandLockup({ palette, compact = false }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <img src={logo} alt="Miqueas Language Solutions logo" className={compact ? "h-11 w-auto shrink-0 object-contain sm:h-12" : "h-16 w-auto shrink-0 object-contain"} />
      <div className="min-w-0 text-left">
        <div className={compact ? "max-w-[190px] truncate text-sm font-bold leading-tight sm:max-w-none" : "text-lg font-bold tracking-tight"} style={{ color: palette.charcoal }}>
          Miqueas Language Solutions
        </div>
        <div className={compact ? "mt-0.5 max-w-[190px] truncate text-[11px] leading-tight sm:max-w-none" : "text-sm"} style={{ color: palette.burgundy }}>
          Bridging Perspectives. Delivering Understanding.
        </div>
      </div>
    </div>
  );
}

function InterpreterLoginButton({ palette }) {
  if (isClerkConfigured) {
    return <AuthStatus palette={palette} />;
  }

  return (
    <Link to="/login" className="whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-semibold leading-tight text-white transition hover:-translate-y-0.5" style={{ backgroundColor: lightPalette.burgundy }}>
      Interpreter Login
    </Link>
  );
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const palette = theme === "dark" ? darkPalette : lightPalette;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("mls-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  };

  return (
    <div className={`theme-${theme} min-h-screen overflow-x-hidden bg-white pb-24 text-slate-900 transition-colors duration-300 md:pb-0`}>
      <AccessibilityOverlay theme={theme} onToggle={toggleTheme} palette={palette} />

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur">
        <div className="border-b border-black/5">
          <div className="mx-auto grid max-w-[96rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-4 py-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-10 md:px-8 md:py-5 xl:px-10">
            <Link to="/" className="min-w-0 shrink-0">
              <div className="hidden md:block"><BrandLockup palette={palette} /></div>
              <div className="md:hidden"><BrandLockup palette={palette} compact /></div>
            </Link>

            <nav className="hidden min-w-0 items-center justify-center md:flex">
              <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-7 gap-y-2">
                {navItems.map((item) => (
                  <Link key={item.path} to={item.path} className="whitespace-nowrap text-[13px] font-semibold leading-tight transition hover:opacity-70 xl:text-sm" style={{ color: palette.charcoal }}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="hidden shrink-0 items-center gap-3 md:flex md:self-center">
              <Link to="/contact" className="whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-semibold leading-tight text-white transition hover:-translate-y-0.5 xl:px-5" style={{ backgroundColor: lightPalette.burgundy }}>
                Request an Interpreter
              </Link>
              <Link to="/join-our-team" className="whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-semibold leading-tight text-white transition hover:-translate-y-0.5 xl:px-5" style={{ backgroundColor: lightPalette.burgundy }}>
                Join Our Team
              </Link>
              <InterpreterLoginButton palette={palette} />
            </div>

            <div className="ml-auto flex items-center gap-2 md:hidden">
              <button className="shrink-0 rounded-xl border border-black/10 px-3 py-2 text-lg leading-none" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle menu" type="button" style={{ color: palette.charcoal, borderColor: palette.border, backgroundColor: palette.white }}>
                {mobileOpen ? "×" : "☰"}
              </button>
            </div>
          </div>
        </div>

        <div className="hidden border-b border-black/5 bg-[rgba(245,245,245,0.85)] sm:block">
          <div className="mx-auto flex max-w-[96rem] flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 py-2.5 text-sm md:px-8 xl:px-10">
            <div className="inline-flex items-center gap-3 font-semibold" style={{ color: palette.burgundy }}>
              <span>Connect With Us</span>
              <div className="flex items-center gap-2">
                {socialItems.map(({ href, label, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ backgroundColor: lightPalette.gold }}>
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>
            <div className="hidden h-4 w-px bg-black/10 sm:block" />
            <a href="tel:+13213798010" className="inline-flex items-center gap-2 font-medium transition hover:opacity-75" style={{ color: palette.charcoal }}>
              <Phone size={14} style={{ color: palette.gold }} />
              <span>(321) 379-8010</span>
            </a>
            <div className="hidden h-4 w-px bg-black/10 sm:block" />
            <a href="mailto:m.stubbs@miqueaslanguagesolutions.com" className="inline-flex items-center gap-2 font-medium transition hover:opacity-75" style={{ color: palette.charcoal }}>
              <Mail size={14} style={{ color: palette.gold }} />
              <span className="break-all sm:break-normal">m.stubbs@miqueaslanguagesolutions.com</span>
            </a>
          </div>
        </div>

        {mobileOpen && (
          <div className="max-h-[calc(100vh-76px)] overflow-y-auto border-b border-black/5 bg-white md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-black/5" style={{ color: palette.charcoal }} onClick={() => setMobileOpen(false)}>
                  {item.label}
                </Link>
              ))}

              <div className="mt-3 border-t border-black/10 pt-4 text-center">
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: palette.burgundy }}>
                  Connect With Us
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {socialItems.map(({ href, label, Icon }) => (
                    <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm" style={{ backgroundColor: lightPalette.gold }} onClick={() => setMobileOpen(false)}>
                      <Icon size={17} />
                    </a>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  <a href="tel:+13213798010" className="flex items-center justify-center gap-2 rounded-xl bg-black/[0.03] px-3 py-3 text-sm font-semibold" style={{ color: palette.charcoal }}>
                    <Phone size={15} style={{ color: palette.gold }} />
                    (321) 379-8010
                  </a>
                  <a href="mailto:m.stubbs@miqueaslanguagesolutions.com" className="flex items-center justify-center gap-2 rounded-xl bg-black/[0.03] px-3 py-3 text-sm font-semibold" style={{ color: palette.charcoal }}>
                    <Mail size={15} style={{ color: palette.gold }} />
                    <span className="break-all">m.stubbs@miqueaslanguagesolutions.com</span>
                  </a>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Link to="/contact" className="inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold text-white" style={{ backgroundColor: lightPalette.burgundy }} onClick={() => setMobileOpen(false)}>
                    Request an Interpreter
                  </Link>
                  <Link to="/join-our-team" className="inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold text-white" style={{ backgroundColor: lightPalette.burgundy }} onClick={() => setMobileOpen(false)}>
                    Join Our Team
                  </Link>
                  <Link to="/login" className="inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold text-white sm:col-span-2" style={{ backgroundColor: lightPalette.burgundy }} onClick={() => setMobileOpen(false)}>
                    Interpreter Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home palette={palette} />} />
          <Route path="/blog" element={<Blog palette={palette} />} />
          <Route path="/blog/:slug" element={<BlogPost palette={palette} />} />
          <Route path="/clients" element={<ResourcesClients palette={palette} />} />
          <Route path="/interpreters" element={<ResourcesInterpreters palette={palette} />} />
          <Route path="/deaf-and-hard-of-hearing" element={<DeafHardOfHearing palette={palette} />} />
          <Route path="/consumers" element={<Navigate to="/deaf-and-hard-of-hearing" replace />} />
          <Route path="/resources" element={<Navigate to="/clients" replace />} />
          <Route path="/resources/clients" element={<Navigate to="/clients" replace />} />
          <Route path="/resources/interpreters" element={<Navigate to="/interpreters" replace />} />
          <Route path="/join-our-team" element={<InterpreterNetworkForm palette={palette} />} />
          <Route path="/login/*" element={<Login palette={palette} />} />
          <Route path="/login.html" element={<Navigate to="/login" replace />} />
          <Route path="/portal" element={isClerkConfigured ? <RequirePortalAuth><InterpreterPortal palette={palette} /></RequirePortalAuth> : <PortalSetupNotice palette={palette} />} />
          <Route path="/admin/interpreters" element={isClerkConfigured ? <RequirePortalAuth><AdminInterpreters palette={palette} /></RequirePortalAuth> : <PortalSetupNotice palette={palette} />} />
          <Route path="/admin/interpreters/:interpreterId" element={isClerkConfigured ? <RequirePortalAuth><AdminInterpreterProfile palette={palette} /></RequirePortalAuth> : <PortalSetupNotice palette={palette} />} />
          <Route path="/services" element={<Services palette={palette} />} />
          <Route path="/services/:serviceId" element={<ServiceDetail palette={palette} />} />
          <Route path="/about" element={<About palette={palette} />} />
          <Route path="/policies" element={<PoliciesLayout palette={palette} />}>
            <Route index element={<Navigate to="clients" replace />} />
            <Route path="clients" element={<PoliciesClients palette={palette} />} />
            <Route path="consumers" element={<PoliciesConsumers palette={palette} />} />
            <Route path="interpreters" element={<PoliciesInterpreters palette={palette} />} />
          </Route>
          <Route path="/contact" element={<Contact palette={palette} />} />
          <Route path="/privacy" element={<PrivacyPolicy palette={palette} />} />
          <Route path="/terms" element={<Terms palette={palette} />} />
          <Route path="/accessibility" element={<Accessibility palette={palette} />} />
          <Route path="/interpreter-community" element={<InterpreterCommunity palette={palette} />} />
        </Routes>
      </main>

      <footer className="mt-16 bg-[#202020] px-4 pt-12 pb-8 text-white md:px-8 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 text-center md:text-left lg:grid-cols-[1.25fr_0.8fr_0.9fr_1.15fr]">
            <div className="space-y-5">
              <Link to="/" className="mx-auto inline-flex max-w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:mx-0">
                <img src={logo} alt="Miqueas Language Solutions logo" className="h-12 w-auto shrink-0 object-contain sm:h-14" />
                <div className="min-w-0 text-left">
                  <div className="max-w-[210px] truncate text-sm font-bold leading-tight text-[#464747] sm:max-w-none sm:text-base">Miqueas Language Solutions</div>
                  <div className="mt-1 max-w-[210px] truncate text-xs font-semibold text-[#721100] sm:max-w-none">Bridging Perspectives. Delivering Understanding.</div>
                </div>
              </Link>
              <p className="mx-auto max-w-md text-sm leading-7 text-white/75 md:mx-0">
                Professional ASL/English interpreting and ASL video translation services built around clarity, access, and genuine human connection.
              </p>
              <Link to="/contact" className="inline-flex rounded-2xl px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5" style={{ backgroundColor: lightPalette.gold }}>
                Request Services
              </Link>
            </div>

            <div>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#dd7d00]">Services</h2>
              <div className="flex flex-col gap-3 text-sm text-white/75">
                {footerServiceItems.map((item) => (
                  <Link key={item.path} to={item.path} className="transition hover:text-white">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#dd7d00]">Quick Links</h2>
              <div className="flex flex-col gap-3 text-sm text-white/75">
                <Link to="/about" className="transition hover:text-white">About MLS</Link>
                <Link to="/blog" className="transition hover:text-white">Blog</Link>
                <Link to="/clients" className="transition hover:text-white">Client Information</Link>
                <Link to="/interpreters" className="transition hover:text-white">Interpreter Information</Link>
                <Link to="/deaf-and-hard-of-hearing" className="transition hover:text-white">Deaf & Hard of Hearing</Link>
                <Link to="/join-our-team" className="transition hover:text-white">Join Our Roster</Link>
                <Link to="/login" className="transition hover:text-white">Interpreter Login</Link>
                <Link to="/policies" className="transition hover:text-white">Policies</Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#dd7d00]">Contact</h2>
              <div className="space-y-4 text-sm text-white/75">
                <a href="tel:+13213798010" className="flex items-center justify-center gap-3 transition hover:text-white md:justify-start"><Phone size={17} style={{ color: lightPalette.gold }} /><span>(321) 379-8010</span></a>
                <a href="mailto:m.stubbs@miqueaslanguagesolutions.com" className="flex items-start justify-center gap-3 transition hover:text-white md:justify-start"><Mail size={17} style={{ color: lightPalette.gold, flexShrink: 0 }} /><span className="break-all text-left">m.stubbs@miqueaslanguagesolutions.com</span></a>
                <div className="flex justify-center gap-3 pt-2">
                  {socialItems.map(({ href, label, Icon }) => (
                    <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-[#dd7d00]">
                      <Icon size={17} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center md:p-6 md:text-left">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-[#dd7d00]">Professional Affiliations</h2>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-white/70 md:mx-0">
                  Proudly connected to professional interpreting organizations and continuing standards of practice.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 md:justify-end">
                <a href={ridCredlyBadgeLink} target="_blank" rel="noreferrer" aria-label="RID credential badge on Credly" className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <img src={ridCredlyBadgeUrl} alt="RID credential badge" className="max-h-full max-w-full object-contain" />
                </a>
                <a href="https://www.fridcentral.org/" target="_blank" rel="noreferrer" aria-label="Florida Registry of Interpreters for the Deaf website" className="flex h-24 w-48 items-center justify-center overflow-hidden rounded-2xl bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:h-32 sm:w-64">
                  <img src={flridLogoUrl} alt="Florida Registry of Interpreters for the Deaf logo" className="max-h-full max-w-full object-contain" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/60 md:justify-start">
              {legalItems.map((item) => <Link key={item.path} to={item.path} className="transition hover:text-white">{item.label}</Link>)}
            </div>
            <div className="text-sm text-white/50">© {new Date().getFullYear()} Miqueas Language Solutions LLC. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
