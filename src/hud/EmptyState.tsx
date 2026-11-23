import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  title: string;
  message: string;
}

/** Fills an area that has no content, and tells the user why. */
export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <p className={styles.title}>{title}</p>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
