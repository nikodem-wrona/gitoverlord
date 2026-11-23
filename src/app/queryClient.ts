import { QueryClient } from "@tanstack/react-query";

/** Creates a query client. Each test calls this to get an isolated cache. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // The backend is local. A command that fails will fail again immediately.
        retry: false,
        // Window focus does not make local data stale.
        refetchOnWindowFocus: false,
      },
    },
  });
}
