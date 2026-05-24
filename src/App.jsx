import React, { useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import About from "./pages/About";
import ResourcesLayout from "./pages/ResourcesLayout";
import ResourcesClients from "./pages/ResourcesClients";
import ResourcesInterpreters from "./pages/ResourcesInterpreters";
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

const flridLogoUrl = "/FRID-Logo-wText-2.png";
const ridCredlyBadgeUrl = "https://images.credly.com/size/680x680/images/eec9e878-8dcd-48fe-b57e-7e4d55637755/image.png";

const navItems = [
  { path: "/", label: "Home" },
  { path: "/services", label: "Services" },
  { path: "/about", label: "About" },
  { path: "/clients", label: "Clients" },
  { path: "/interpreters", label: "Interpreters" },
  { path: "/deaf-and-hard-of-hearing", label: "Deaf & Hard of Hearing" },
];

const socialItems = [
  {
    href: "https://www.instagram.com/miqueas.language.solutions/",
    label: "Instagram",
    Icon: FaInstagram,
  },
  {
    href: "https://www.facebook.com/profile.php?id=61573286078153",
    label: "Facebook",
    Icon: FaFacebookF,
  },
  {
    href: "https://www.linkedin.com/in/micah-stubbs-7a7802145/",
    label: "LinkedIn",
    Icon: FaLinkedinIn,
  },
];

const legalItems = [
  { path: "/policies/clients", label: "Client Policies" },
  { path: "/policies/consumers", label: "Consumer Access" },
  { path: "/privacy", label: "Privacy Policy" },
  { path: "/terms", label: "Terms & Conditions" },
  { path: "/accessibility", label: "Accessibility" },
];

const footerServiceItems = [
  "ASL/English Interpreting",
  "Remote Interpreting",
  "On-Site Interpreting",
  "ASL Video Translation",
];

function BrandLockup({ compact = false }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <img src={logo} alt="Miqueas Language Solutions logo" className={compact ? "h-12 w-auto shrink-0 object-contain" : "h-16 w-auto shrink-0 object-contain"} />
      <div className="min-w-0 text-left">
        <div className={compact ? "text-sm font-bold leading-tight" : "text-lg font-bold tracking-tight"} style={{ color: palette.charcoal }}>
          Miqueas Language Solutions
        </div>
        <div className={compact ? "mt-0.5 text-[11px] leading-tight" : "text-sm"} style={{ color: palette.burgundy }}>
          Bridging Perspectives. Delivering Understanding.
        </div>
      </div>
    </div>
  );
}

function DeafAndHardOfHearingPage({ palette }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
      <div
        className="rounded-[2rem] border p-6 shadow-sm md:p-10"
        style={{
          borderColor: palette.border,
          background: `linear-gradient(135deg, ${palette.white} 0%, ${palette.softGray} 100%)`,
        }}
      >
        <div
          className="mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ backgroundColor: `${palette.gold}14`, color: palette.gold }}
        >
          Deaf & Hard of Hearing
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl" style={{ color: palette.charcoal }}>
          Deaf & Hard of Hearing Resources
        </h1>
        <p className="max-w-3xl text-base leading-7 md:text-lg" style={{ color: palette.body }}>
          Resources for Deaf, DeafBlind, hard-of-hearing, late-deafened, and hearing community members are being organized here.
        </p>
      </div>
    </section>
  );
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white pb-24 text-slate-900 md:pb-0">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur">
        <div className="border-b border-black/5">
          <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-x-8 gap-y-3 px-4 py-5 md:px-8">
            <Link to="/" className="shrink-0">
              <div className="hidden md:block"><BrandLockup /></div>
              <div className="md:hidden"><BrandLockup compact /></div>
            </Link>

            <nav className="hidden items-center justify-center md:flex">
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-6">
                {navItems.map((item) => (
                  <Link key={item.path} to={item.path} className="text-sm font-medium leading-tight transition hover:opacity-70" style={{ color: palette.charcoal }}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="hidden items-center gap-2 md:flex md:self-center">
              <Link to="/contact" className="rounded-2xl px-4 py-2.5 text-sm font-semibold leading-tight text-white transition hover:-translate-y-0.5" style={{ backgroundColor: palette.burgundy }}>
                Request an Interpreter
              </Link>
              <Link to="/join-our-team" className="rounded-2xl px-4 py-2.5 text-sm font-semibold leading-tight text-white transition hover:-translate-y-0.5" style={{ backgroundColor: palette.burgundy }}>
                Join Our Team
              </Link>
            </div>

            <button className="col-start-3 row-start-1 ml-auto shrink-0 rounded-xl p-2 md:hidden" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle menu" type="button">
              {mobileOpen ? "X" : "☰"}
            </button>
          </div>
        </div>

        <div className="border-b border-black/5 bg-[rgba(245,245,245,0.85)]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 py-2.5 text-sm md:px-8">
            <div className="inline-flex items-center gap-3 font-semibold" style={{ color: palette.burgundy }}>
              <span>Connect With Us</span>
              <div className="flex items-center gap-2">
                {socialItems.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    style={{ backgroundColor: palette.gold }}
                  >
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
          <div className="border-b border-black/5 bg-white md:hidden">
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
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm"
                      style={{ backgroundColor: palette.gold }}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon size={17} />
                    </a>
                  ))}
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Link
                    to="/contact"
                    className="inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold text-white"
                    style={{ backgroundColor: palette.burgundy }}
                    onClick={() => setMobileOpen(false)}
                  >
                    Request an Interpreter
                  </Link>
                  <Link
                    to="/join-our-team"
                    className="inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold text-white"
                    style={{ backgroundColor: palette.burgundy }}
                    onClick={() => setMobileOpen(false)}
                  >
                    Join Our Team
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
          <Route path="/clients" element={<ResourcesClients palette={palette} />} />
          <Route path="/interpreters" element={<ResourcesInterpreters palette={palette} />} />
          <Route path="/deaf-and-hard-of-hearing" element={<DeafAndHardOfHearingPage palette={palette} />} />
          <Route path="/consumers" element={<Navigate to="/deaf-and-hard-of-hearing" replace />} />
          <Route path="/join-our-team" element={<InterpreterNetworkForm palette={palette} />} />
          <Route path="/services" element={<Services palette={palette} />} />
          <Route path="/services/:serviceId" element={<ServiceDetail palette={palette} />} />
          <Route path="/about" element={<About palette={palette} />} />
          <Route path="/resources" element={<ResourcesLayout palette={palette} />}>
            <Route index element={<Navigate to="clients" replace />} />
            <Route path="clients" element={<ResourcesClients palette={palette} />} />
            <Route path="interpreters" element={<ResourcesInterpreters palette={palette} />} />
          </Route>
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

      <footer className="mt-16 bg-[#202020] px-4 pt-14 pb-8 text-white md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1.25fr_0.8fr_0.9fr_1.15fr]">
            <div className="space-y-5">
              <Link to="/" className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <img src={logo} alt="Miqueas Language Solutions logo" className="h-14 w-auto object-contain" />
                <div className="min-w-0 text-left">
                  <div className="text-base font-bold leading-tight text-[#464747]">Miqueas Language Solutions</div>
                  <div className="mt-1 text-xs font-semibold text-[#721100]">Bridging Perspectives. Delivering Understanding.</div>
                </div>
              </Link>
              <p className="max-w-md text-sm leading-7 text-white/75">
                Professional ASL/English interpreting and ASL video translation services built around clarity, access, and genuine human connection.
              </p>
              <Link to="/contact" className="inline-flex rounded-2xl px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5" style={{ backgroundColor: palette.gold }}>
                Request Services
              </Link>
            </div>

            <div>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#dd7d00]">Services</h2>
              <div className="flex flex-col gap-3 text-sm text-white/75">
                {footerServiceItems.map((item) => (
                  <Link key={item} to="/services" className="transition hover:text-white">
                    {item}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#dd7d00]">Quick Links</h2>
              <div className="flex flex-col gap-3 text-sm text-white/75">
                <Link to="/about" className="transition hover:text-white">About MLS</Link>
                <Link to="/clients" className="transition hover:text-white">Client Information</Link>
                <Link to="/interpreters" className="transition hover:text-white">Interpreter Information</Link>
                <Link to="/deaf-and-hard-of-hearing" className="transition hover:text-white">Deaf & Hard of Hearing</Link>
                <Link to="/join-our-team" className="transition hover:text-white">Join Our Roster</Link>
                <Link to="/policies" className="transition hover:text-white">Policies</Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#dd7d00]">Contact</h2>
              <div className="space-y-4 text-sm text-white/75">
                <a href="tel:+13213798010" className="flex items-center gap-3 transition hover:text-white"><Phone size={17} style={{ color: palette.gold }} /><span>(321) 379-8010</span></a>
                <a href="mailto:m.stubbs@miqueaslanguagesolutions.com" className="flex items-start gap-3 transition hover:text-white"><Mail size={17} style={{ color: palette.gold }} /><span className="break-all">m.stubbs@miqueaslanguagesolutions.com</span></a>
                <div className="flex gap-3 pt-2">
                  {socialItems.map(({ href, label, Icon }) => (
                    <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-[#dd7d00]">
                      <Icon size={17} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-[#dd7d00]">Professional Affiliations</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                  Proudly connected to professional interpreting organizations and continuing standards of practice.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 md:justify-end">
                <a href="https://www.credly.com/" target="_blank" rel="noreferrer" aria-label="RID credential badge on Credly" className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <img src={ridCredlyBadgeUrl} alt="RID credential badge" className="max-h-full max-w-full object-contain" />
                </a>
                <a href="https://www.fridcentral.org/" target="_blank" rel="noreferrer" aria-label="Florida Registry of Interpreters for the Deaf website" className="flex h-28 w-56 items-center justify-center overflow-hidden rounded-2xl bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:h-32 sm:w-64">
                  <img src={flridLogoUrl} alt="Florida Registry of Interpreters for the Deaf logo" className="max-h-full max-w-full object-contain" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60">
              {legalItems.map((item) => <Link key={item.path} to={item.path} className="transition hover:text-white">{item.label}</Link>)}
            </div>
            <div className="text-sm text-white/50">© {new Date().getFullYear()} Miqueas Language Solutions LLC. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
