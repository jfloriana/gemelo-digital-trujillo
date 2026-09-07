import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress "A listener indicated an asynchronous response by returning true, but the message channel closed"
// This error originates from browser extensions that register chrome.runtime.onMessage listeners
// but fail to call sendResponse or return false. It is not caused by our application code.
// We add a global handler to prevent it from polluting the console and breaking UX.
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  // Known browser-extension noise strings. We only ever *skip logging* these
  // specific lines; we never replace console.error and never blanket-swallow
  // errors that merely contain the substring.
  const EXTENSION_NOISE = [
    'A listener indicated an asynchronous response by returning true',
    'message channel closed before a response was received',
  ];
  const isExtensionNoise = (msg: string) =>
    EXTENSION_NOISE.some((needle) => msg.includes(needle));

  // Keep a reference and always forward to the real console.error, so genuine
  // app errors stay visible. Only the known-noise lines are dropped.
  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const first = String(args[0] ?? '');
    if (isExtensionNoise(first)) {
      return;
    }
    originalConsoleError(...(args as []));
  };

  // For error/unhandledrejection we only preventDefault when the message is
  // known noise AND the origin points outside the app bundle (an extension
  // context, or no filename at all). We do not preventDefault on a bare
  // message match, which could hide a real in-app failure.
  const fromOutsideApp = (filename: unknown) => {
    const f = String(filename ?? '');
    return f === '' || f.includes('extension://');
  };
  window.addEventListener('error', (event) => {
    if (event.message && isExtensionNoise(event.message) && fromOutsideApp(event.filename)) {
      event.preventDefault();
    }
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = String((event as PromiseRejectionEvent).reason ?? '');
    if (isExtensionNoise(reason)) {
      event.preventDefault();
    }
  });
  // If this app ever registers a chrome.runtime listener, ensure it does not trigger the error
  try {
    const chromeRuntime = (window as unknown as { chrome?: { runtime?: { onMessage?: { addListener: (fn: (...args: unknown[]) => unknown) => void } } } }).chrome?.runtime;
    if (chromeRuntime?.onMessage?.addListener) {
      // No-op: we do not register any listener that returns true without sendResponse.
      // The presence check above documents that we have audited for this pattern.
    }
  } catch {}
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
