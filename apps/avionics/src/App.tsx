import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Restore display mode on app load
(() => {
  const mode = localStorage.getItem("avionics-display-mode");
  document.documentElement.classList.remove("light", "high-contrast");
  if (mode === "light") {
    document.documentElement.classList.add("light");
  } else if (mode === "high-contrast") {
    document.documentElement.classList.add("high-contrast");
  }
})();

// Restore color scheme on app load
(() => {
  const schemeId = localStorage.getItem("avionics-color-scheme");
  if (schemeId) {
    try {
      // Check user schemes first
      const userRaw = localStorage.getItem("avionics-user-schemes");
      const userSchemes = userRaw ? JSON.parse(userRaw) : [];
      const allSchemes = [
        { id: "default", vars: { "--avionics-green": "160 100% 45%", "--avionics-cyan": "185 100% 55%", "--avionics-magenta": "300 80% 60%", "--avionics-amber": "40 100% 55%" } },
        ...userSchemes,
      ];
      const scheme = allSchemes.find((s: any) => s.id === schemeId);
      if (scheme) {
        Object.entries(scheme.vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v as string));
      }
    } catch {}
  }
})();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
