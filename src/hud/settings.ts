/** Reads a setting of the user. `null` when it is not set or storage is not available. */
export function readSetting(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Keeps a setting of the user for the next start. */
export function writeSetting(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage is not available. The setting applies to this session only.
  }
}
