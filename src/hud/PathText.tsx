import styles from "./PathText.module.css";

/**
 * A file path that keeps the file name in view.
 *
 * When the space is too small, the folder part is cut and the file name stays.
 */
export function PathText({ path }: { path: string }) {
  const nameStart = path.lastIndexOf("/") + 1;

  return (
    <span className={styles.path} title={path}>
      <span className={styles.folder}>{path.slice(0, nameStart)}</span>
      <span className={styles.name}>{path.slice(nameStart)}</span>
    </span>
  );
}
