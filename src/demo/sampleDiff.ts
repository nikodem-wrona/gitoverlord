import type { DiffLine, FileDiff } from "@/ipc";

const FIRST_LINE = 12;

/** The lines of the sample diff: `" "` for context, `"-"` for removed, `"+"` for added. */
const LINES: readonly (readonly [sign: " " | "-" | "+", text: string])[] = [
  [" ", 'import { Panel } from "@/hud";'],
  [" ", ""],
  ["-", "const REVEAL_DELAY = 80;"],
  ["+", "const REVEAL_DELAY = 120;"],
  ["+", "const SWEEP_SECONDS = 7;"],
  [" ", ""],
  [" ", "export function scan(target: string): Signal {"],
  ["-", "  return probe(target);"],
  ["+", "  const signal = probe(target, SWEEP_SECONDS);"],
  ["+", "  return signal.locked ? signal : retry(target);"],
  [" ", "}"],
];

/** Makes a sample diff. Each file gets the same lines. */
export function sampleDiff(): FileDiff {
  let oldLine = FIRST_LINE;
  let newLine = FIRST_LINE;
  const lines = LINES.map(([sign, text]): DiffLine => {
    if (sign === "-") {
      return { kind: "removed", oldLine: oldLine++, newLine: null, text };
    }
    if (sign === "+") {
      return { kind: "added", oldLine: null, newLine: newLine++, text };
    }
    return { kind: "context", oldLine: oldLine++, newLine: newLine++, text };
  });
  const header = `@@ -${FIRST_LINE},${oldLine - FIRST_LINE} +${FIRST_LINE},${newLine - FIRST_LINE} @@`;

  return { binary: false, truncated: false, hunks: [{ header, lines }] };
}
