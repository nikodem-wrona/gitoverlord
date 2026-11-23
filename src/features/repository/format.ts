const HASH_LENGTH = 7;

/** Shortens a commit hash for the screen. */
export function shortHash(hash: string): string {
  return hash.slice(0, HASH_LENGTH);
}

/** Formats Unix seconds as `2026-11-23` in the time zone of the user. */
export function formatDay(seconds: number): string {
  const date = new Date(seconds * 1000);
  const day = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
  return day.map(pad).join("-");
}

/** Formats Unix seconds as `2026-11-23 12:04` in the time zone of the user. */
export function formatTime(seconds: number): string {
  const date = new Date(seconds * 1000);
  const time = [date.getHours(), date.getMinutes()];
  return `${formatDay(seconds)} ${time.map(pad).join(":")}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
