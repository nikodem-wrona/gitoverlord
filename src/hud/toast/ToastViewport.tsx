import { type CSSProperties, useEffect } from "react";

import type { Tone } from "../tone";
import type { ToastItem, ToastKind } from "./toastContext";
import styles from "./Toast.module.css";

const TONES: Record<ToastKind, Tone> = {
  info: "accent",
  ok: "ok",
  fail: "fail",
};

interface ToastViewportProps {
  toasts: readonly ToastItem[];
  duration: number;
  onDismiss(id: number): void;
}

/** The live region that holds the notifications. */
export function ToastViewport({
  toasts,
  duration,
  onDismiss,
}: ToastViewportProps) {
  return (
    <section aria-label="Notifications" className={styles.viewport}>
      <ol aria-live="polite" className={styles.list}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            duration={duration}
            onDismiss={onDismiss}
          />
        ))}
      </ol>
    </section>
  );
}

interface ToastProps {
  toast: ToastItem;
  duration: number;
  onDismiss(id: number): void;
}

function Toast({ toast, duration, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onDismiss]);

  const style = { "--toast-duration": `${duration}ms` } as CSSProperties;

  return (
    <li className={styles.toast} data-tone={TONES[toast.kind]} style={style}>
      <div className={styles.text}>
        <p className={styles.title}>{toast.title}</p>
        {toast.message && <p className={styles.message}>{toast.message}</p>}
      </div>
      <button
        type="button"
        className={styles.dismiss}
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
      >
        ×
      </button>
      <span className={styles.timer} aria-hidden="true" />
    </li>
  );
}
