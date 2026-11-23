import { type ReactNode, useId } from "react";

import styles from "./Panel.module.css";

interface PanelProps {
  title: string;
  children: ReactNode;
}

/** A framed container with a title bar. */
export function Panel({ title, children }: PanelProps) {
  const titleId = useId();

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
