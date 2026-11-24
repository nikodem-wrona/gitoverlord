import { useRef } from "react";

import { Button, type useRowWindow } from "@/hud";
import type { ConflictChoice, ConflictSide } from "@/ipc";

import styles from "./ConflictPanel.module.css";
import { type ConflictRow, keeps } from "./conflictRows";

const SIDE_NAMES: Record<ConflictSide, string> = {
  ours: "Current",
  theirs: "Incoming",
};

const CHOICES: readonly { choice: ConflictChoice; text: string }[] = [
  { choice: "ours", text: "Current" },
  { choice: "theirs", text: "Incoming" },
  { choice: "both", text: "Both" },
];

interface ConflictLinesProps {
  label: string;
  rows: readonly ConflictRow[];
  control: ReturnType<typeof useRowWindow>;
  choices: readonly (ConflictChoice | undefined)[];
  onChoose(index: number, choice: ConflictChoice): void;
}

/**
 * The lines of a file with its conflicts. Each conflict shows the lines of both
 * sides, and buttons that choose the lines to keep. Kept lines are green.
 */
export function ConflictLines(props: ConflictLinesProps) {
  const { label, rows, control, choices, onChoose } = props;
  const { scrollRef, onScroll, window } = control;
  const headers = rows.flatMap((row, at) =>
    row.type === "header" ? [at] : [],
  );
  const jump = useRef(-1);
  const next = () => {
    jump.current = (jump.current + 1) % headers.length;
    scrollToRow(scrollRef.current, headers[jump.current] ?? 0);
  };

  return (
    <div className={styles.frame}>
      <Button compact className={styles.next} onClick={next}>
        Next conflict
      </Button>
      <div
        ref={scrollRef}
        role="group"
        aria-label={label}
        tabIndex={0}
        className={styles.scroll}
        onScroll={onScroll}
      >
        <div className={styles.rows}>
          <div style={{ height: window.before }} />
          {rows.slice(window.start, window.end).map((row) => (
            <LineRow
              key={row.key}
              row={row}
              total={headers.length}
              choice={"index" in row ? choices[row.index] : undefined}
              onChoose={onChoose}
            />
          ))}
          <div style={{ height: window.after }} />
        </div>
      </div>
    </div>
  );
}

interface LineRowProps {
  row: ConflictRow;
  total: number;
  choice?: ConflictChoice;
  onChoose(index: number, choice: ConflictChoice): void;
}

function LineRow({ row, total, choice, onChoose }: LineRowProps) {
  switch (row.type) {
    case "clean":
      return (
        <div data-row className={styles.row} data-kind="clean">
          {row.text}
        </div>
      );
    case "header":
      return (
        <div data-row className={styles.row} data-kind="header">
          <span>{`Conflict ${row.index + 1} of ${total} · line ${row.line}`}</span>
          <ChoiceButtons
            index={row.index}
            choice={choice}
            onChoose={onChoose}
          />
        </div>
      );
    case "side":
      return (
        <div
          data-row
          className={styles.row}
          data-kind="side"
          data-side={row.side}
        >
          {`${SIDE_NAMES[row.side]} · ${row.label}`}
        </div>
      );
    case "code":
      return (
        <div
          data-row
          className={styles.row}
          data-kind="code"
          data-side={row.side}
          data-kept={keeps(choice, row.side)}
        >
          {row.text}
        </div>
      );
  }
}

interface ChoiceButtonsProps {
  index: number;
  choice?: ConflictChoice;
  onChoose(index: number, choice: ConflictChoice): void;
}

/** The buttons that choose the lines of one conflict. The chosen button is green. */
function ChoiceButtons({ index, choice, onChoose }: ChoiceButtonsProps) {
  return CHOICES.map((option) => (
    <Button
      key={option.choice}
      compact
      variant={choice === option.choice ? "primary" : "ghost"}
      aria-pressed={choice === option.choice}
      aria-label={`Conflict ${index + 1}: keep ${option.text.toLowerCase()}`}
      onClick={() => onChoose(index, option.choice)}
    >
      {option.text}
    </Button>
  ));
}

/** Scrolls until the row at `index` is at the top. */
function scrollToRow(element: HTMLElement | null, index: number): void {
  const height = element
    ?.querySelector("[data-row]")
    ?.getBoundingClientRect().height;
  if (element && height) element.scrollTop = index * height;
}
