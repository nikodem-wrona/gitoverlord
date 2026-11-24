import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ActionProvider } from "@/actions";
import {
  MotionProvider,
  SoundProvider,
  ThemeProvider,
  ToastProvider,
} from "@/hud";

interface AppProvidersProps {
  queryClient: QueryClient;
  children: ReactNode;
}

/** The providers that the application, the gallery, and the tests share. */
export function AppProviders({ queryClient, children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MotionProvider>
          <SoundProvider>
            <ToastProvider>
              <ActionProvider>{children}</ActionProvider>
            </ToastProvider>
          </SoundProvider>
        </MotionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
