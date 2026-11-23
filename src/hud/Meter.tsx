import styles from "./Meter.module.css";
import type { Tone } from "./tone";

interface MeterProps {
  label: string;
  value: number;
  max: number;
  tone?: Tone;
  /** The number of segments in the bar. */
  segments?: number;
}

/** A segmented bar that shows a value against a maximum. */
export function Meter({
  label,
  value,
  max,
  tone = "accent",
  segments = 12,
}: MeterProps) {
  const ratio = max > 0 ? Math.min(Math.max(value, 0), max) / max : 0;
  const filled = Math.round(ratio * segments);

  return (
    <div className={styles.meter} data-tone={tone}>
      <span className={styles.label}>{label}</span>
      <span
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={styles.track}
      >
        {Array.from({ length: segments }, (_, index) => (
          <span
            key={index}
            className={styles.segment}
            data-on={index < filled || undefined}
          />
        ))}
      </span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}
