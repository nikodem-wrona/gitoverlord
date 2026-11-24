import { type KeyboardEvent, useEffect, useId } from "react";

import { nextKey } from "../keys";
import { useRowWindow } from "../rows/useRowWindow";
import type { Column } from "./columns";
import styles from "./Table.module.css";
import { type RowTone, TableHead, TableRow, TableSpacer } from "./TableParts";

/** The table asks for more rows when this number of rows, or fewer, is left below the view. */
const END_MARGIN = 20;

interface TableProps<Row> {
  /** The accessible name of the table. */
  label: string;
  columns: readonly Column<Row>[];
  rows: readonly Row[];
  getRowKey(row: Row): string;
  selectedKey?: string;
  onSelect?(key: string): void;
  getRowTone?(row: Row): RowTone | undefined;
  /**
   * A CSS width, for example `40rem`. A narrower table scrolls to the side, so the
   * columns without a width keep some space.
   */
  minWidth?: string;
  /** Runs when the user comes near the last row. Use it to load more rows. */
  onEndReached?(): void;
}

/**
 * A dense data table. A click or the arrow keys select a row.
 *
 * The table renders only the rows that are in view, so it stays fast with many rows.
 */
export function Table<Row>(props: TableProps<Row>) {
  const { label, columns, rows, getRowKey, selectedKey, onSelect } = props;
  const baseId = useId();
  const rowId = (key: string) => `${baseId}-${key}`;
  const { scrollRef, onScroll, window, scrollToIndex } = useRowWindow(
    rows.length,
  );
  useEndReached(rows.length, rows.length - window.end, props.onEndReached);
  const onKeyDown = keyHandler(props, scrollToIndex);

  return (
    <div ref={scrollRef} className={styles.scroll} onScroll={onScroll}>
      <table
        role="grid"
        aria-label={label}
        aria-rowcount={rows.length}
        aria-activedescendant={selectedKey ? rowId(selectedKey) : undefined}
        tabIndex={0}
        className={styles.table}
        style={{ minWidth: props.minWidth }}
        onKeyDown={onKeyDown}
      >
        <TableHead columns={columns} />
        <tbody>
          <TableSpacer height={window.before} span={columns.length} />
          {rows.slice(window.start, window.end).map((row, offset) => {
            const key = getRowKey(row);
            return (
              <TableRow
                key={key}
                id={rowId(key)}
                index={window.start + offset}
                row={row}
                columns={columns}
                selected={key === selectedKey}
                tone={props.getRowTone?.(row)}
                onSelect={onSelect && (() => onSelect(key))}
              />
            );
          })}
          <TableSpacer height={window.after} span={columns.length} />
        </tbody>
      </table>
    </div>
  );
}

/** Makes the key handler: the arrow keys, Home, and End select a row and scroll to it. */
function keyHandler<Row>(
  { rows, getRowKey, selectedKey, onSelect }: TableProps<Row>,
  scrollToIndex: (index: number) => void,
) {
  return (event: KeyboardEvent<HTMLTableElement>) => {
    const keys = rows.map(getRowKey);
    const next = nextKey(keys, selectedKey, event.key, "vertical");
    if (next === undefined || !onSelect) return;
    event.preventDefault();
    onSelect(next);
    scrollToIndex(keys.indexOf(next));
  };
}

/** Calls `onEndReached` while only a few rows are left below the view. */
function useEndReached(
  count: number,
  remaining: number,
  onEndReached?: () => void,
): void {
  useEffect(() => {
    if (count > 0 && remaining <= END_MARGIN) onEndReached?.();
  }, [count, remaining, onEndReached]);
}
