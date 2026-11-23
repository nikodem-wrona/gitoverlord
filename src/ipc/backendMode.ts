let demo = false;

/** Records that sample data replaces the Rust core. The demo backend calls this. */
export function markDemoBackend(): void {
  demo = true;
}

/** Returns `true` when the data on the screen is sample data. */
export function isDemoBackend(): boolean {
  return demo;
}
