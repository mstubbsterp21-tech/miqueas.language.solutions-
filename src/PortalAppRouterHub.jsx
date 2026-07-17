import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import MLSWebAppHub from "./pages/MLSWebAppHub";
import PortalSetupNotice from "./components/PortalSetupNotice";
import RequirePortalAuth from "./components/RequirePortalAuth";
import PortalSecurityGate from "./portal/PortalSecurityGate";
import { isClerkConfigured } from "./lib/env";

const appPalette = {
  burgundy: "#721100",
  gold: "#dd7d00",
  charcoal: "#464747",
  white: "#ffffff",
  softGray: "#f5f5f5",
  border: "#d1c6bc",
  body: "#444444",
};

function ensureMeta(name, content) {
  let element = document.head.querySelector(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export default function PortalAppRouterHub() {
  useEffect(() => {
    let manifest = document.head.querySelector('link[rel="manifest"]');
    if (!manifest) {
      manifest = document.createElement("link");
      manifest.setAttribute("rel", "manifest");
      document.head.appendChild(manifest);
    }
    manifest.setAttribute("href", "/manifest.webmanifest");
    ensureMeta("theme-color", "#721100");
    ensureMeta("apple-mobile-web-app-capable", "yes");
    ensureMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
    ensureMeta("apple-mobile-web-app-title", "MLS");
    ensureMeta("robots", "noindex, nofollow, noarchive");
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `https://miqueaslanguagesolutions.com${window.location.pathname}`);
    document.title = window.location.pathname.startsWith("/login") ? "MLS Secure Login" : "MLS Secure Portal";
    document.documentElement.style.backgroundColor = "#f7f3ef";
  }, []);

  return <Routes>
    <Route path="/login/*" element={<Login palette={appPalette} />} />
    <Route path="/portal" element={isClerkConfigured ? <RequirePortalAuth><PortalSecurityGate><MLSWebAppHub /></PortalSecurityGate></RequirePortalAuth> : <PortalSetupNotice palette={appPalette} />} />
    <Route path="/admin/interpreters" element={<Navigate to="/portal?section=people" replace />} />
    <Route path="/admin/interpreters/:interpreterId" element={<Navigate to="/portal?section=people" replace />} />
    <Route path="*" element={<Navigate to="/portal" replace />} />
  </Routes>;
}
