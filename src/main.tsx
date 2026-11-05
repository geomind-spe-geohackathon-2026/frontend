import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { createQueryClient } from "@/app/query-client";
import { Providers } from "@/app/providers";
import { createRouter } from "@/app/router";
import { toApiMode } from "@/shared/api/mode";
import { startTheme } from "@/shared/layout/theme";
import "@/styles/index.css";

async function start(): Promise<void> {
  startTheme();
  window.addEventListener("vite:preloadError", () => {
    try {
      const last = Number(sessionStorage.getItem("geomind-chunk-reload") ?? "0");
      if (Date.now() - last < 30_000) return;
      sessionStorage.setItem("geomind-chunk-reload", String(Date.now()));
    } catch {
      return;
    }
    window.location.reload();
  });
  if (import.meta.env.DEV && toApiMode(import.meta.env.VITE_API_MODE, true) === "mock") {
    const { startMocking } = await import("@/mocks/browser");
    await startMocking();
  }
  const container = document.getElementById("root");
  if (container === null) throw new Error("The page has no #root element");
  createRoot(container).render(
    <StrictMode>
      <Providers queryClient={createQueryClient()}>
        <RouterProvider router={createRouter()} />
      </Providers>
    </StrictMode>,
  );
}

void start();
