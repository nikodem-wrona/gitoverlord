import { type ReactNode, useCallback, useMemo, useState } from "react";

import { createToastApi, ToastContext, type ToastItem } from "./toastContext";
import { ToastViewport } from "./ToastViewport";

const MAX_TOASTS = 4;

interface ToastProviderProps {
  /** The time that each notification stays, in milliseconds. */
  duration?: number;
  children: ReactNode;
}

/** Supplies `useToast` and shows the notifications at the bottom right. */
export function ToastProvider({
  duration = 5000,
  children,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<readonly ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const api = useMemo(
    () =>
      createToastApi((toast) => {
        // Only the newest notifications stay.
        setToasts((current) => [...current, toast].slice(-MAX_TOASTS));
      }, dismiss),
    [dismiss],
  );

  return (
    <ToastContext value={api}>
      {children}
      <ToastViewport toasts={toasts} duration={duration} onDismiss={dismiss} />
    </ToastContext>
  );
}
