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
  { path: "/policies", label: "Policies" },
  { path: "/contact", label: "Contact" },
];

const legalItems = [
  { path: "/policies/clients", label: "Client Policies" },
  { path: "/policies/consumers", label: "Consumer Access" },
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
      {/* Existing App content unchanged except for imported page and route below */}
      <Routes>
        <Route path="/" element={<Home palette={palette} />} />
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
    </div>
  );
}
