import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";

import { AppProviders } from "@/app/AppProviders";
import { createQueryClient } from "@/app/queryClient";

/** Renders `ui` with the application providers and an isolated query cache. */
export function renderWithProviders(ui: ReactElement): RenderResult {
  return render(
    <AppProviders queryClient={createQueryClient()}>{ui}</AppProviders>,
  );
}
