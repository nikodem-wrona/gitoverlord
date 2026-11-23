import type { CSSProperties } from "react";

import styles from "./LogoMark.module.css";

/** The gitoverlord emblem in the accent color. The size is in CSS units. */
export function LogoMark({ size = "1.5rem" }: { size?: string }) {
  const style = { "--logo-size": size } as CSSProperties;
  return <span className={styles.mark} style={style} aria-hidden="true" />;
}
