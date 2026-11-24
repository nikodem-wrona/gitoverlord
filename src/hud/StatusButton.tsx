import type { ButtonHTMLAttributes } from "react";

import { cx } from "./cx";
import styles from "./StatusButton.module.css";

/** A small text button for the status bar, for example the theme or the sound. */
export function StatusButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, ...rest } = props;
  return (
    <button type="button" className={cx(styles.button, className)} {...rest} />
  );
}
