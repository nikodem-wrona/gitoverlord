import { type CSSProperties, type ReactNode, useId } from "react";

import { cx } from "./cx";
import styles from "./Panel.module.css";

interface PanelProps {
  title: string;
  /** Short status text at the right side of the title bar. */
  meta?: ReactNode;
  /** The delay before the panel reveals itself, in milliseconds. */
  delay?: number;
  /** Removes the inner padding, for tables and maps. */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

/** A framed container with a title bar. It reveals itself when it mounts. */
export function Panel(props: PanelProps) {
  const { title, meta, delay = 0, flush = false, className, children } = props;
  const titleId = useId();
  const style = { "--reveal-delay": `${delay}ms` } as CSSProperties;

  return (
    <section
      className={cx(styles.panel, className)}
      style={style}
      aria-labelledby={titleId}
    >
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {meta !== undefined && <div className={styles.meta}>{meta}</div>}
      </header>
      <div className={styles.body} data-flush={flush || undefined}>
        {children}
      </div>
    </section>
  );
}
