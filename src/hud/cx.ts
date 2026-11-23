/** Joins class names and skips the empty ones. */
export function cx(...names: readonly (string | false | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}
