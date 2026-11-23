import { useState } from "react";

import { AppProviders } from "./AppProviders";
import { createQueryClient } from "./queryClient";
import { Root } from "./Root";

/** The application root. */
export function App() {
  const [queryClient] = useState(createQueryClient);

  return (
    <AppProviders queryClient={queryClient}>
      <Root />
    </AppProviders>
  );
}
