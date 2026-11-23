// The entry point of the component gallery. Vite serves it in development only.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AppProviders } from "@/app/AppProviders";
import { createQueryClient } from "@/app/queryClient";
import "@/hud/global.css";

import { Gallery } from "./Gallery";

const root = document.getElementById("root");
if (!root) throw new Error("The #root element is missing from gallery.html.");

createRoot(root).render(
  <StrictMode>
    <AppProviders queryClient={createQueryClient()}>
      <Gallery />
    </AppProviders>
  </StrictMode>,
);
