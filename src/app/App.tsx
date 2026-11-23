import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { SystemStatus } from "@/features/system";

import styles from "./App.module.css";
import { createQueryClient } from "./queryClient";

/** The application root. It supplies the providers and the first screen. */
export function App() {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <main className={styles.screen}>
        <SystemStatus />
      </main>
    </QueryClientProvider>
  );
}
