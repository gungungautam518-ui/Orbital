import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global fetch interceptor to support Bearer token authentication fallback
// This handles situations where cookies are blocked inside iframes in AI Studio.
const originalFetch = window.fetch;

const customFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem("auth_token");
  if (token) {
    if (typeof input === "string" || input instanceof URL) {
      init = init || {};
      let headers: Headers;
      if (init.headers instanceof Headers) {
        headers = init.headers;
      } else if (Array.isArray(init.headers)) {
        headers = new Headers(init.headers);
      } else {
        headers = new Headers(init.headers || {});
      }
      
      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      init.headers = headers;
    } else if (input instanceof Request) {
      try {
        if (!input.headers.has("Authorization")) {
          input.headers.set("Authorization", `Bearer ${token}`);
        }
      } catch (e) {
        // If Request headers are read-only, clone the Request with the new header
        try {
          const newHeaders = new Headers(input.headers);
          newHeaders.set("Authorization", `Bearer ${token}`);
          input = new Request(input, { headers: newHeaders });
        } catch (cloneErr) {
          console.error("Failed to clone Request headers for Authorization injection:", cloneErr);
        }
      }
    }
  }
  return originalFetch(input, init);
};

try {
  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    writable: true,
    configurable: true,
    enumerable: true
  });
} catch (err) {
  console.warn("Failed to redefine window.fetch with defineProperty. Trying direct assignment...", err);
  try {
    (window as any).fetch = customFetch;
  } catch (directErr) {
    console.error("Unable to override window.fetch:", directErr);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

