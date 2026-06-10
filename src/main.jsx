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

ReactDOM.createRoot(document.getElementById('root')).render(
  isClerkConfigured ? <ClerkProvider publishableKey={clerkPublishableKey}>{app}</ClerkProvider> : app,
);
