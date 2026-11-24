import { readSetting, writeSetting } from "../settings";

const CALM_KEY = "gitoverlord.calm";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Reads the calm mode setting of the user. */
export function readCalmSetting(): boolean {
  return readSetting(CALM_KEY) === "true";
}

/** Keeps the calm mode setting of the user for the next start. */
export function writeCalmSetting(calm: boolean): void {
  writeSetting(CALM_KEY, String(calm));
}

/** Tells if the operating system asks for reduced motion. */
export function systemPrefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION).matches;
}

/** Calls `onChange` when the reduced-motion preference of the system changes. */
export function subscribeReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
