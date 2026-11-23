import { type ReactNode, useCallback, useMemo, useState } from "react";

import {
  createToastApi,
  ToastContext,
  type ToastInput,
  type ToastItem,
  type ToastKind,
} from "./toastContext";
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

  const api = useMemo(
    () =>
      createToastApi((kind, input) => {
        setToasts((current) => withToast(current, kind, input));
      }),
    [],
  );

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext value={api}>
      {children}
      <ToastViewport toasts={toasts} duration={duration} onDismiss={dismiss} />
    </ToastContext>
  );
}

/** Adds a notification and keeps only the newest ones. */
function withToast(
  current: readonly ToastItem[],
  kind: ToastKind,
  input: ToastInput,
): ToastItem[] {
  const id = Math.max(0, ...current.map((toast) => toast.id)) + 1;
  return [...current, { ...input, kind, id }].slice(-MAX_TOASTS);
}
