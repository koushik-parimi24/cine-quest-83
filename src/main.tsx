import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from 'next-themes';
import SupabaseProvider from "./providers/SupabaseProvider";
import { WatchlistProvider } from "./context/WatchlistContext";

// ✅ Render app
createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system">
    <SupabaseProvider>
      <WatchlistProvider>
        <App />
      </WatchlistProvider>
    </SupabaseProvider>
  </ThemeProvider>
);

// ✅ Register Monetag Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Monetag Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.error('❌ Monetag Service Worker registration failed:', error);
      });
  });
}
