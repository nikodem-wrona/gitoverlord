import type { ConflictBlock, ConflictChoice, ConflictSide } from "@/ipc";

/**
 * One row of the conflict resolver: a clean line, the header of a conflict,
 * the name of a side, or a line of a side. `index` is the number of the conflict.
 */
export type ConflictRow =
  | { type: "clean"; key: string; text: string }
  | { type: "header"; key: string; index: number; line: number }
  | {
      type: "side";
      key: string;
      index: number;
      side: ConflictSide;
      label: string;
    }
  | {
      type: "code";
      key: string;
      index: number;
      side: ConflictSide;
      text: string;
    };

/** Makes one list of rows from the parts of a file. */
export function conflictRows(blocks: readonly ConflictBlock[]): ConflictRow[] {
  let index = -1;
  return blocks.flatMap((block, at): ConflictRow[] => {
    if (block.kind === "clean") {
      return block.lines.map((text, line) => ({
        type: "clean",
        key: `${at}:${line}`,
        text,
      }));
    }
    index += 1;
    return [
      { type: "header", key: `${at}`, index, line: block.line },
      ...sideRows(`${at}`, index, "ours", block.oursLabel, block.ours),
      ...sideRows(`${at}`, index, "theirs", block.theirsLabel, block.theirs),
    ];
  });
}

function sideRows(
  key: string,
  index: number,
  side: ConflictSide,
  label: string,
  lines: readonly string[],
): ConflictRow[] {
  return [
    { type: "side", key: `${key}:${side}`, index, side, label },
    ...lines.map((text, line): ConflictRow => ({
      type: "code",
      key: `${key}:${side}:${line}`,
      index,
      side,
      text,
    })),
  ];
}

/** The count of the conflicts in a file. */
export function conflictCount(blocks: readonly ConflictBlock[]): number {
  return blocks.filter((block) => block.kind === "conflict").length;
}

/** `true` when `choice` keeps the lines of `side`. `undefined` before a choice. */
export function keeps(
  choice: ConflictChoice | undefined,
  side: ConflictSide,
): boolean | undefined {
  if (choice === undefined) return undefined;
  return choice === "both" || choice === side;
}

/** The names of the two sides, from the markers of the first conflict. */
export function sideLabels(blocks: readonly ConflictBlock[]): {
  ours: string;
  theirs: string;
} {
  const first = blocks.find((block) => block.kind === "conflict");
  return {
    ours: first?.oursLabel || "HEAD",
    theirs: first?.theirsLabel || "incoming",
  };
}
