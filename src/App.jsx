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
import { Mail, Phone } from "lucide-react";

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
      <style>{`
        @keyframes mlsPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(221, 125, 0, 0.18); }
          50% { transform: scale(1.03); box-shadow: 0 0 0 10px rgba(221, 125, 0, 0); }
        }
      `}</style>

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur">
        <div className="border-b border-black/5">
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
        </div>

        <div className="border-b border-black/5 bg-[rgba(245,245,245,0.85)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 py-2.5 text-sm md:px-8">
            <a
              href="tel:+13213798010"
              className="inline-flex items-center gap-2 font-medium transition hover:opacity-75"
              style={{ color: palette.charcoal }}
            >
              <Phone size={14} style={{ color: palette.gold }} />
              <span>(321) 379-8010</span>
            </a>

            <div className="hidden h-4 w-px bg-black/10 sm:block" />

            <a
              href="mailto:m.stubbs@miqueaslanguagesolutions.com"
              className="inline-flex items-center gap-2 font-medium transition hover:opacity-75"
              style={{ color: palette.charcoal }}
            >
              <Mail size={14} style={{ color: palette.gold }} />
              <span className="break-all sm:break-normal">m.stubbs@miqueaslanguagesolutions.com</span>
            </a>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-b border-black/5 bg-white md:hidden">
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

      <footer className="mt-16 bg-[#202020] px-4 pt-14 pb-8 text-white md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.45fr_0.9fr_0.9fr_1.15fr]">
            <div className="space-y-5">
              <Link to="/" className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <img
                  src={logo}
                  alt="Miqueas Language Solutions logo"
                  className="h-14 w-auto object-contain"
                />
                <div className="min-w-0">
                  <div className="text-base font-bold leading-tight text-[#464747]">
                    Miqueas Language Solutions
                  </div>
                  <div className="mt-1 text-xs font-semibold text-[#721100]">
                    Bridging Perspectives. Delivering Understanding.
                  </div>
                </div>
              </Link>

              <p className="max-w-md text-sm leading-7 text-white/75">
                Professional ASL/English interpreting and ASL video translation services built around clarity, access, and genuine human connection.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/contact"
                  className="rounded-2xl px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5"
                  style={{ backgroundColor: palette.gold, color: palette.white }}
                >
                  Request Services
                </Link>
                <Link
                  to="/resources/clients"
                  className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/10"
                >
                  Client Resources
                </Link>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#dd7d00]">
                Services
              </h2>
              <div className="flex flex-col gap-3 text-sm text-white/75">
                <Link to="/services" className="transition hover:text-white">ASL/English Interpreting</Link>
                <Link to="/services" className="transition hover:text-white">Remote Interpreting</Link>
                <Link to="/services" className="transition hover:text-white">On-Site Interpreting</Link>
                <Link to="/services" className="transition hover:text-white">ASL Video Translation</Link>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#dd7d00]">
                Explore
              </h2>
              <div className="flex flex-col gap-3 text-sm text-white/75">
                {navItems.map((item) => (
                  <Link key={item.path} to={item.path} className="transition hover:text-white">
                    {item.label}
                  </Link>
                ))}
                <Link to="/resources/interpreters" className="transition hover:text-white">
                  Join Our Roster
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#dd7d00]">
                Contact
              </h2>
              <div className="space-y-4 text-sm text-white/75">
                <a
                  href="tel:+13213798010"
                  className="flex items-center gap-3 transition hover:text-white"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Phone size={17} style={{ color: palette.gold }} />
                  </span>
                  <span>(321) 379-8010</span>
                </a>

                <a
                  href="mailto:m.stubbs@miqueaslanguagesolutions.com"
                  className="flex items-start gap-3 transition hover:text-white"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Mail size={17} style={{ color: palette.gold }} />
                  </span>
                  <span className="break-all">m.stubbs@miqueaslanguagesolutions.com</span>
                </a>

                <div className="rounded-2xl bg-white/5 p-4 leading-6">
                  Remote services available nationwide. Florida-based on-site services available by request.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-[#dd7d00]">
                Professional Affiliations & Credentials
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
                MLS prioritizes ethical practice, clear communication, and professional standards in every interpreting request.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:justify-end">
              <a
                href="https://www.credly.com/badges/a160083c-07d6-4c48-adb3-6ad7e0d7b8d5/wallet"
                target="_blank"
                rel="noreferrer"
                aria-label="View credential badge on Credly"
                className="rounded-2xl bg-white p-2 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <img
                  src="https://images.credly.com/size/340x340/images/eec9e878-8dcd-48fe-b57e-7e4d55637755/image.png"
                  alt="Credential badge"
                  className="h-14 w-14 object-contain"
                  loading="lazy"
                />
              </a>
              <a
                href="https://www.fridcentral.org/"
                target="_blank"
                rel="noreferrer"
                aria-label="Visit Florida Registry of Interpreters for the Deaf"
                className="rounded-2xl bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <img
                  src="https://www.fridcentral.org/resources/Pictures/FRID-Logo-wText.png"
                  alt="Florida Registry of Interpreters for the Deaf logo"
                  className="h-12 max-w-[160px] object-contain"
                  loading="lazy"
                />
              </a>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-6 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60">
              {legalItems.map((item) => (
                <Link key={item.path} to={item.path} className="transition hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/miqueas.language.solutions/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-[#dd7d00]"
              >
                <FaInstagram size={17} />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61573286078153"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-[#dd7d00]"
              >
                <FaFacebookF size={17} />
              </a>
              <a
                href="https://www.linkedin.com/in/micah-stubbs-7a7802145/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-[#dd7d00]"
              >
                <FaLinkedinIn size={17} />
              </a>
            </div>
          </div>

          <div className="mt-6 text-sm text-white/50">
            © {new Date().getFullYear()} Miqueas Language Solutions LLC. All rights reserved.
          </div>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Link
            to="/contact"
            className="inline-flex flex-1 items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 active:scale-[0.98]"
            style={{
              backgroundColor: palette.gold,
              color: palette.white,
            }}
          >
            Request Services
          </Link>

          <a
            href="tel:+13213798010"
            className="inline-flex flex-1 items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold transition duration-200 active:scale-[0.98]"
            style={{
              borderColor: palette.border,
              backgroundColor: palette.white,
              color: palette.charcoal,
              animation: 'mlsPulse 8s ease-in-out infinite',
            }}
          >
            Call Now
          </a>
        </div>
      </div>
    </div>
  );
}
