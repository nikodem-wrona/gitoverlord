import { type CSSProperties, useEffect } from "react";

import type { Tone } from "../tone";
import type { ToastItem, ToastKind } from "./toastContext";
import styles from "./Toast.module.css";

const TONES: Record<ToastKind, Tone> = {
  info: "accent",
  ok: "ok",
  warn: "warn",
  fail: "fail",
};

/** A notification with a button stays longer, so the user has time to use it. */
const ACTION_TIME_FACTOR = 2;

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
            duration={toast.action ? duration * ACTION_TIME_FACTOR : duration}
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
  useAutoDismiss(toast, duration, onDismiss);
  const style = { "--toast-duration": `${duration}ms` } as CSSProperties;
  const { action } = toast;

  return (
    <li className={styles.toast} data-tone={TONES[toast.kind]} style={style}>
      <div className={styles.text}>
        <p className={styles.title}>{toast.title}</p>
        {toast.message && <p className={styles.message}>{toast.message}</p>}
      </div>
      {action && (
        <button
          type="button"
          className={styles.action}
          onClick={() => {
            onDismiss(toast.id);
            action.run();
          }}
        >
          {action.label}
        </button>
      )}
      <button
        type="button"
        className={styles.dismiss}
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
      >
        ×
      </button>
      {!toast.sticky && <span className={styles.timer} aria-hidden="true" />}
    </li>
  );
}

/** Closes the notification after `duration`. A sticky notification stays. */
function useAutoDismiss(
  toast: ToastItem,
  duration: number,
  onDismiss: (id: number) => void,
): void {
  const { id, sticky } = toast;
  useEffect(() => {
    if (sticky) return undefined;
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, sticky, duration, onDismiss]);
}
