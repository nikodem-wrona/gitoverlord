import type { ReactNode } from "react";

import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  title: string;
  message: string;
  /** A button that solves the cause, for example a sign-in button. */
  action?: ReactNode;
}

/** Fills an area that has no content, and tells the user why. */
export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <p className={styles.title}>{title}</p>
      <p className={styles.message}>{message}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
