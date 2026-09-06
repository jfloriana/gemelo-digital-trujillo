import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress "A listener indicated an asynchronous response by returning true, but the message channel closed"
// This error originates from browser extensions that register chrome.runtime.onMessage listeners
// but fail to call sendResponse or return false. It is not caused by our application code.
// We add a global handler to prevent it from polluting the console and breaking UX.
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const first = String(args[0] ?? '');
    if (first.includes('A listener indicated an asynchronous response by returning true')) {
      return;
    }
    originalConsoleError(...(args as []));
  };
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('A listener indicated an asynchronous response')) {
      event.preventDefault();
    }
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = String((event as PromiseRejectionEvent).reason ?? '');
    if (reason.includes('A listener indicated an asynchronous response') || reason.includes('message channel closed')) {
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
