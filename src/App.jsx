import React, { useState, useMemo } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Services from "./pages/Services";
import About from "./pages/About";
import ResourcesLayout from "./pages/ResourcesLayout";
import ResourcesClients from "./pages/ResourcesClients";
import ResourcesInterpreters from "./pages/ResourcesInterpreters";
import Contact from "./pages/Contact";
import logo from "./logo.png";
import { FaInstagram, FaLinkedinIn } from "react-icons/fa";

const palette = {
  burgundy: "#721100",
  gold: "#dd7d00",
  charcoal: "#464747",
  white: "#ffffff",
  softGray: "#f5f5f5",
  border: "#e5e5e5",
};

const navItems = [
  { path: "/", label: "Home" },
  { path: "/services", label: "Services" },
  { path: "/about", label: "About" },
  { path: "/resources", label: "Resources" },
  { path: "/contact", label: "Contact" },
];

function BrandLockup({ showTagline = true }) {
  return (
    <>
      <img
        src={logo}
        alt="Miqueas Language Solutions logo"
        className="h-20 w-auto object-contain"
      />
      <div className="min-w-0">
        <div
          className="text-lg font-bold tracking-tight"
          style={{ color: palette.charcoal }}
        >
          Miqueas Language Solutions
        </div>
        {showTagline && (
          <div className="text-sm" style={{ color: palette.burgundy }}>
            Bridging Perspectives. Delivering Understanding.
          </div>
        )}
      </div>
    </>
  );
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <BrandLockup />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
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

            <div className="ml-2 flex items-center gap-3">
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
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: palette.burgundy }}
              >
                Request a Quote
              </Link>
            </div>
          </nav>

          <button
            className="rounded-xl p-2 md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle menu"
            type="button"
          >
            {mobileOpen ? "X" : "☰"}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-black/5 bg-white md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
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

              <div className="mt-2 flex items-center gap-3">
                <a
                  href="https://www.instagram.com/miqueas.language.solutions/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition duration-200"
                  style={{ backgroundColor: palette.gold, color: palette.white }}
                  onClick={() => setMobileOpen(false)}
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
                  href="https://www.linkedin.com/in/micah-stubbs-7a7802145/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl transition duration-200"
                  style={{ backgroundColor: palette.gold, color: palette.white }}
                  onClick={() => setMobileOpen(false)}
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
                  className="flex-1 rounded-2xl px-4 py-3 text-center text-sm font-semibold text-white"
                  style={{ backgroundColor: palette.burgundy }}
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
        </Routes>
      </main>

      <footer className="border-t border-black/5 px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BrandLockup showTagline={false} />
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className="hover:text-slate-900">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="text-sm text-slate-500">
            © {year} Miqueas Language Solutions. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}