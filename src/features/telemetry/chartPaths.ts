/**
 * Makes an SVG path that connects the values from left to right.
 *
 * The largest value touches the top. Zero touches the bottom.
 */
export function sparklinePath(
  values: readonly number[],
  width: number,
  height: number,
): string {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command}${round(index * step)} ${round(height - (value / max) * height)}`;
    })
    .join(" ");
}

/** Converts values to bar heights in percent of the largest value. */
export function barHeights(values: readonly number[]): number[] {
  const max = Math.max(...values, 1);
  return values.map((value) => round((value / max) * 100));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
