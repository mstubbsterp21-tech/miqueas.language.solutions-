import React, { useState, useMemo } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import Home from "./pages/Home";
import Services from "./pages/Services";
import About from "./pages/About";
import Resources from "./pages/Resources";
import Contact from "./pages/Contact";
import logo from "./logo.png";

// Define the color palette used throughout the site.
const palette = {
  burgundy: "#721100",
  gold: "#dd7d00",
  charcoal: "#464747",
  white: "#ffffff",
  softGray: "#f5f5f5",
  border: "#e5e5e5",
};

// Navigation items for the header and footer.
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
      <Analytics />
      {/* Header with navigation and mobile menu toggle */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <BrandLockup />
          </Link>

          {/* Desktop navigation */}
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

            {/* External Instagram link */}
            <a
              href="https://www.instagram.com/miqueas.language.solutions/"
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-3 py-2 text-xs font-semibold transition hover:opacity-80"
              style={{ backgroundColor: palette.gold, color: "#ffffff" }}
            >
              IG
            </a>

            {/* CTA button to request a quote */}
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
              style={{ backgroundColor: palette.burgundy }}
            >
              Request a Quote
            </Link>
          </nav>

          {/* Mobile menu toggle button */}
          <button
            className="rounded-xl p-2 md:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle menu"
            type="button"
          >
            {mobileOpen ? "X" : "☰"}
          </button>
        </div>

        {/* Mobile navigation drawer */}
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

              {/* External Instagram link on mobile */}
              <a
                href="https://www.instagram.com/miqueas.language.solutions/"
                target="_blank"
                rel="noreferrer"
                className="mt-2 rounded-2xl px-4 py-3 text-center text-sm font-semibold"
                style={{ backgroundColor: palette.gold, color: "#ffffff" }}
                onClick={() => setMobileOpen(false)}
              >
                Instagram
              </a>

              {/* CTA button on mobile */}
              <Link
                to="/contact"
                className="rounded-2xl px-4 py-3 text-center text-sm font-semibold text-white"
                style={{ backgroundColor: palette.burgundy }}
                onClick={() => setMobileOpen(false)}
              >
                Request a Quote
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main content area with routes */}
      <main>
        <Routes>
          <Route path="/" element={<Home palette={palette} />} />
          <Route path="/services" element={<Services palette={palette} />} />
          <Route path="/about" element={<About palette={palette} />} />
          <Route path="/resources" element={<Resources palette={palette} />} />
          <Route path="/contact" element={<Contact palette={palette} />} />
        </Routes>
      </main>

      {/* Footer with links and copyright */}
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
