import { createContext, useContext } from "react";

export type ToastKind = "info" | "ok" | "warn" | "fail";

/** A button in a notification, for example Undo. */
export interface ToastAction {
  label: string;
  run(): void;
}

export interface ToastOptions {
  action?: ToastAction;
  /** Keeps the notification until `dismiss` removes it. Use it for work in progress. */
  sticky?: boolean;
}

export interface ToastInput extends ToastOptions {
  title: string;
  message?: string;
}

export interface ToastItem extends ToastInput {
  id: number;
  kind: ToastKind;
}

/** Shows a notification and returns its id. */
type ShowToast = (
  title: string,
  message?: string,
  options?: ToastOptions,
) => number;

/** Shows short notifications. There is one function for each kind. */
export interface ToastApi extends Record<ToastKind, ShowToast> {
  dismiss(id: number): void;
}

export const ToastContext = createContext<ToastApi | null>(null);

/** Returns the functions that show notifications. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast needs a ToastProvider above it.");
  return api;
}

/** Makes the notification functions from one `push` function. Each notification gets a new id. */
export function createToastApi(
  push: (toast: ToastItem) => void,
  dismiss: (id: number) => void,
): ToastApi {
  let lastId = 0;
  const forKind =
    (kind: ToastKind): ShowToast =>
    (title, message, options) => {
      lastId += 1;
      push({ title, message, ...options, kind, id: lastId });
      return lastId;
    };
  return {
    info: forKind("info"),
    ok: forKind("ok"),
    warn: forKind("warn"),
    fail: forKind("fail"),
    dismiss,
  };
}
