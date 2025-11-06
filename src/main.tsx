import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from 'next-themes';
import SupabaseProvider from "./providers/SupabaseProvider";
import { WatchlistProvider } from "./context/WatchlistContext";


createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system">
    <SupabaseProvider>
      <WatchlistProvider>
        <App />
      </WatchlistProvider>
    </SupabaseProvider>
  </ThemeProvider>
);
