import type { ReactNode } from "react";

import styles from "./ToolLayout.module.css";

interface ToolLayoutProps {
  /** The accessible name of the toolbar. */
  label: string;
  /** The buttons of the toolbar. */
  tools: ReactNode;
  children: ReactNode;
}

/** A toolbar above content that takes the rest of the height, for example a table. */
export function ToolLayout({ label, tools, children }: ToolLayoutProps) {
  return (
    <div className={styles.layout}>
      <div role="toolbar" aria-label={label} className={styles.bar}>
        {tools}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
