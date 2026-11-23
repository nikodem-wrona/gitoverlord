import { QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";

import { createQueryClient } from "@/app/queryClient";

/** Renders `ui` with the application providers and an isolated query cache. */
export function renderWithProviders(ui: ReactElement): RenderResult {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      {ui}
    </QueryClientProvider>,
  );
}
