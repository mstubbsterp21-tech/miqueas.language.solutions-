import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import App from './App';
import PortalAppRouter from './PortalAppRouter';
import ScrollToTop from './components/ScrollToTop';
import { clerkPublishableKey, isClerkConfigured } from './lib/env';
import './index.css';

function RootRouter() {
  const { pathname } = useLocation();
  const isPortalPath = pathname.startsWith('/portal') || pathname.startsWith('/login') || pathname.startsWith('/admin/interpreters');
  return isPortalPath ? <PortalAppRouter /> : <App />;
}

const app = (
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <RootRouter />
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
