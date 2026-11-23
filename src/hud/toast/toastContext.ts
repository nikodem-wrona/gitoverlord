import { createContext, useContext } from "react";

export type ToastKind = "info" | "ok" | "fail";

export interface ToastInput {
  title: string;
  message?: string;
}

export interface ToastItem extends ToastInput {
  id: number;
  kind: ToastKind;
}

/** Shows a short notification. There is one function for each kind. */
export type ToastApi = Record<
  ToastKind,
  (title: string, message?: string) => void
>;

export const ToastContext = createContext<ToastApi | null>(null);

/** Returns the functions that show notifications. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast needs a ToastProvider above it.");
  return api;
}

/** Makes the notification functions from one `push` function. */
export function createToastApi(
  push: (kind: ToastKind, input: ToastInput) => void,
): ToastApi {
  const forKind = (kind: ToastKind) => (title: string, message?: string) =>
    push(kind, { title, message });
  return { info: forKind("info"), ok: forKind("ok"), fail: forKind("fail") };
}
