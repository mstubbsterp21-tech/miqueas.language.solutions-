import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import AccessibilityTools from './components/AccessibilityTools';
import ScrollToTop from './components/ScrollToTop';
import { clerkPublishableKey, isClerkConfigured } from './lib/env';
import './index.css';
import './portal/portal-theme.css';
import './portal/fluid-card-editor.css';

const App = React.lazy(() => import('./App'));
const PortalAppRouterHub = React.lazy(() => import('./PortalAppRouterHub'));

function LoadingShell() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f7f3ef] p-6" role="status" aria-live="polite">
      <div className="rounded-3xl border border-[#d1c6bc] bg-white px-8 py-6 text-center shadow-xl">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#721100]/20 border-t-[#721100]" aria-hidden="true" />
        <p className="mt-4 font-black text-slate-800">Loading MLS…</p>
      </div>
    </div>
  );
}

function RootRouter() {
  const { pathname } = useLocation();
  const isPortalPath = pathname.startsWith('/portal') || pathname.startsWith('/login') || pathname.startsWith('/admin/interpreters');

  if (isPortalPath) return <PortalAppRouterHub />;

  return (
    <>
      <AccessibilityTools />
      <App />
    </>
  );
}

const app = (
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <React.Suspense fallback={<LoadingShell />}>
        <RootRouter />
      </React.Suspense>
    </BrowserRouter>
  </React.StrictMode>
);

const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isVercelPreview = hostname.endsWith('.vercel.app') && hostname !== 'miqueas-language-solutions.vercel.app';

const clerkProviderProps = isVercelPreview
  ? {
      publishableKey: clerkPublishableKey,
      isSatellite: true,
      domain: hostname,
      signInUrl: 'https://miqueaslanguagesolutions.com/login',
      signUpUrl: 'https://miqueaslanguagesolutions.com/login',
      afterSignOutUrl: 'https://miqueaslanguagesolutions.com/login',
    }
  : {
      publishableKey: clerkPublishableKey,
    };

ReactDOM.createRoot(document.getElementById('root')).render(
  isClerkConfigured ? <ClerkProvider {...clerkProviderProps}>{app}</ClerkProvider> : app,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('MLS app service worker registration failed', error);
    });
  });
}
