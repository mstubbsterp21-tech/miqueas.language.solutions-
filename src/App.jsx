import React, { useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import About from "./pages/About";
import ResourcesLayout from "./pages/ResourcesLayout";
import ResourcesClients from "./pages/ResourcesClients";
import ResourcesInterpreters from "./pages/ResourcesInterpreters";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Accessibility from "./pages/Accessibility";
import logo from "./logo.png";
import { FaInstagram, FaLinkedinIn, FaFacebookF } from "react-icons/fa";

const palette = {
  burgundy: "#721100",
  gold: "#dd7d00",
  charcoal: "#464747",
  white: "#ffffff",
  softGray: "#f5f5f5",
  border: "#e5e5e5",
  body: "#444444",
};

const navItems = [
  { path: "/", label: "Home" },
  { path: "/services", label: "Services" },
  { path: "/about", label: "About" },
  { path: "/resources", label: "Resources" },
  { path: "/contact", label: "Contact" },
];

const legalItems = [
  { path: "/privacy", label: "Privacy Policy" },
  { path: "/terms", label: "Terms & Conditions" },
  { path: "/accessibility", label: "Accessibility" },
];

function BrandLockup({ showTagline = true, mobileCompact = false }) {
  return (
    <>
      <img
        src={logo}
        alt="Miqueas Language Solutions logo"
        className={mobileCompact ? "h-12 w-auto object-contain sm:h-14" : "h-16 w-auto object-contain"}
      />
      <div className="min-w-0">
        <div
          className={mobileCompact ? "text-sm font-bold leading-tight tracking-tight sm:text-base" : "text-lg font-bold tracking-tight"}
          style={{ color: palette.charcoal }}
        >
          Miqueas Language Solutions
        </div>
        {showTagline && (
          <div className={mobileCompact ? "mt-0.5 text-[11px] leading-tight sm:text-xs" : "text-sm"} style={{ color: palette.burgundy }}>
            Bridging Perspectives. Delivering Understanding.
          </div>
        )}
      </div>
    </>
  );
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white pb-24 text-slate-900 md:pb-0">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8 md:py-4">
          <Link to="/" className="flex min-w-0 flex-1 items-center gap-3">
            <div className="hidden md:flex min-w-0 items-center gap-3">
              <BrandLockup />
            </div>
            <div className="flex md:hidden min-w-0 items-center gap-2">
              <BrandLockup mobileCompact />
            </div>
          </Link>

          <nav className="hidden items-center gap-4 lg:gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-sm font-medium transition hover:opacity-70"
                style={{ color: palette.charcoal }}
              >
                {item.label}
              </Link>
            ))}

            <div className="ml-2 flex items-center gap-2">
              <a
                href="https://www.instagram.com/miqueas.language.solutions/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: palette.gold, color: palette.white }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = palette.burgundy;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = palette.gold;
                }}
              >
                <FaInstagram size={18} />
              </a>

              <a
                href="https://www.facebook.com/profile.php?id=61573286078153"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: palette.gold, color: palette.white }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = palette.burgundy;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = palette.gold;
                }}
              >
                <FaFacebookF size={18} />
              </a>

              <a
                href="https://www.linkedin.com/in/micah-stubbs-7a7802145/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: palette.gold, color: palette.white }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = palette.burgundy;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = palette.gold;
                }}
              >
                <FaLinkedinIn size={18} />
              </a>

              <Link
                to="/contact"
                className="btn btn-primary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition"
              >
                Request a Quote
              </Link>
            </div>
          </nav>

          <button
            className="shrink-0 rounded-xl p-2 md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle menu"
            type="button"
          >
            {mobileOpen ? "X" : "☰"}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-black/5 bg-white md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-black/5"
                  style={{ color: palette.charcoal }}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <a
                  href="https://www.instagram.com/miqueas.language.solutions/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition duration-200"
                  style={{ backgroundColor: palette.gold, color: palette.white }}
                  onClick={() => setMobileOpen(false)}
                >
                  <FaInstagram size={18} />
                </a>

                <a
                  href="https://www.facebook.com/profile.php?id=61573286078153"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition duration-200"
                  style={{ backgroundColor: palette.gold, color: palette.white }}
                  onClick={() => setMobileOpen(false)}
                >
                  <FaFacebookF size={18} />
                </a>

                <a
                  href="https://www.linkedin.com/in/micah-stubbs-7a7802145/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition duration-200"
                  style={{ backgroundColor: palette.gold, color: palette.white }}
                  onClick={() => setMobileOpen(false)}
                >
                  <FaLinkedinIn size={18} />
                </a>

                <Link
                  to="/contact"
                  className="btn btn-primary min-w-[180px] flex-1 rounded-2xl px-4 py-3 text-center text-sm font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  Request a Quote
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home palette={palette} />} />
          <Route path="/services" element={<Services palette={palette} />} />
          <Route path="/services/:serviceId" element={<ServiceDetail palette={palette} />} />
          <Route path="/about" element={<About palette={palette} />} />

          <Route path="/resources" element={<ResourcesLayout palette={palette} />}>
            <Route index element={<Navigate to="clients" replace />} />
            <Route path="clients" element={<ResourcesClients palette={palette} />} />
            <Route
              path="interpreters"
              element={<ResourcesInterpreters palette={palette} />}
            />
          </Route>

          <Route path="/contact" element={<Contact palette={palette} />} />
          <Route path="/privacy" element={<PrivacyPolicy palette={palette} />} />
          <Route path="/terms" element={<Terms palette={palette} />} />
          <Route path="/accessibility" element={<Accessibility palette={palette} />} />
        </Routes>
      </main>

      <footer className="mt-10 border-t border-black/5 bg-[rgba(245,245,245,0.7)] px-4 py-8 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[minmax(240px,1.2fr)_minmax(260px,1fr)_minmax(260px,1fr)_auto] md:items-start">
          <div className="flex items-center gap-3">
            <BrandLockup showTagline={false} mobileCompact />
          </div>

          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Navigation
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} className="hover:text-slate-900">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Legal
            </div>
            <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
              {legalItems.map((item) => (
                <Link key={item.path} to={item.path} className="hover:text-slate-900">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end md:justify-self-end">
            <div className="max-w-[210px] text-sm leading-6 text-slate-500 md:text-right">
              © 2026 Miqueas Language Solutions LLC. All rights reserved.
            </div>
            <a
              href="https://www.credly.com/badges/a160083c-07d6-4c48-adb3-6ad7e0d7b8d5/wallet"
              target="_blank"
              rel="noreferrer"
              aria-label="View credential badge on Credly"
              className="shrink-0 transition hover:opacity-80"
            >
              <img
                src="https://images.credly.com/size/340x340/images/eec9e878-8dcd-48fe-b57e-7e4d55637755/image.png"
                alt="Credential badge"
                className="h-14 w-14 object-contain"
                loading="lazy"
              />
            </a>
          </div>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Link
            to="/contact"
            className="inline-flex flex-1 items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold"
            style={{
              backgroundColor: palette.gold,
              color: palette.white,
            }}
          >
            Request Services
          </Link>

          <a
            href="tel:+13213798010"
            className="inline-flex flex-1 items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold"
            style={{
              borderColor: palette.border,
              backgroundColor: palette.white,
              color: palette.charcoal,
            }}
          >
            Call Now
          </a>
        </div>
      </div>
    </div>
  );
}
