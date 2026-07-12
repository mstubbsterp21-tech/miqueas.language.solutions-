import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ScrollToTop from './components/ScrollToTop';
import { clerkPublishableKey, isClerkConfigured } from './lib/env';
import './index.css';

const app = (
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <App />
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
