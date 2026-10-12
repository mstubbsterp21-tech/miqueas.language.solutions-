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

class AppRenderBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('MLS app render failed', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-[100dvh] items-center justify-center bg-[#f7f3ef] p-5">
          <section className="w-full max-w-xl rounded-3xl border border-[#d1c6bc] bg-white p-8 text-center shadow-xl" role="alert">
            <p className="text-xs font-black uppercase tracking-[.16em] text-[#dd7d00]">MLS secure portal</p>
            <h1 className="mt-3 text-2xl font-black text-[#464747]">We couldn’t open this workspace</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Your account and saved data are safe. Reload the page to reconnect to MLS Portal.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="min-h-11 rounded-full bg-[#721100] px-6 py-3 text-sm font-black text-white"
              >
                Reload workspace
              </button>
              <a href="/login" className="inline-flex min-h-11 items-center rounded-full border border-[#d1c6bc] px-6 py-3 text-sm font-bold text-[#464747]">
                Return to login
              </a>
            </div>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

function RootRouter() {
  const { pathname } = useLocation();
  const isPortalPath = pathname.startsWith('/portal') || pathname.startsWith('/login') || pathname.startsWith('/admin/interpreters');

  return (
    <AppRenderBoundary key={pathname}>
      {isPortalPath ? (
        <PortalAppRouterHub />
      ) : (
        <>
          <AccessibilityTools />
          <App />
        </>
      )}
    </AppRenderBoundary>
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
