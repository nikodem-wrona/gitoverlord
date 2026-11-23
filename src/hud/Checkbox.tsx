import styles from "./Checkbox.module.css";

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange(checked: boolean): void;
  disabled?: boolean;
  /** Extra information that shows on hover. */
  title?: string;
}

/** A check box with a square HUD mark. */
export function Checkbox({
  label,
  checked,
  onChange,
  disabled,
  title,
}: CheckboxProps) {
  return (
    <label
      className={styles.checkbox}
      title={title}
      data-disabled={disabled || undefined}
    >
      <input
        type="checkbox"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.box} aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}
