import { markDemoBackend, mockCommands } from "@/ipc";

import { createDemoHandlers } from "./demoHandlers";

export { createDemoHandlers } from "./demoHandlers";
export { SAMPLE_COMMITS } from "./sampleCommits";
export { SAMPLE_SUMMARY, SAMPLE_WORKING_TREE } from "./sampleRepository";

/**
 * Replaces the Rust core with the sample repository.
 *
 * Use it only where there is no Rust core: `pnpm dev` in a browser.
 */
export function installDemoBackend(): void {
  mockCommands(createDemoHandlers());
  markDemoBackend();
}
