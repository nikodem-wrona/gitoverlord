import { type KeyboardEvent, useId } from "react";

import { nextKey } from "../keys";
import type { Column } from "./columns";
import styles from "./Table.module.css";

/** `alert` marks a row that needs attention. `highlight` marks a special row. */
export type RowTone = "alert" | "highlight";

interface TableProps<Row> {
  /** The accessible name of the table. */
  label: string;
  columns: readonly Column<Row>[];
  rows: readonly Row[];
  getRowKey(row: Row): string;
  selectedKey?: string;
  onSelect?(key: string): void;
  getRowTone?(row: Row): RowTone | undefined;
}

/** A dense data table. A click or the arrow keys select a row. */
export function Table<Row>(props: TableProps<Row>) {
  const { label, columns, rows, getRowKey, selectedKey, onSelect, getRowTone } =
    props;
  const baseId = useId();
  const rowId = (key: string) => `${baseId}-${key}`;

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
    const next = nextKey(
      rows.map(getRowKey),
      selectedKey,
      event.key,
      "vertical",
    );
    if (next === undefined || !onSelect) return;
    event.preventDefault();
    onSelect(next);
    document
      .getElementById(rowId(next))
      ?.scrollIntoView?.({ block: "nearest" });
  };

  return (
    <div className={styles.scroll}>
      <table
        role="grid"
        aria-label={label}
        aria-activedescendant={selectedKey ? rowId(selectedKey) : undefined}
        tabIndex={0}
        className={styles.table}
        onKeyDown={onKeyDown}
      >
        <TableHead columns={columns} />
        <tbody>
          {rows.map((row) => {
            const key = getRowKey(row);
            return (
              <TableRow
                key={key}
                id={rowId(key)}
                row={row}
                columns={columns}
                selected={key === selectedKey}
                tone={getRowTone?.(row)}
                onSelect={onSelect && (() => onSelect(key))}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TableHead<Row>({ columns }: { columns: readonly Column<Row>[] }) {
  return (
    <>
      <colgroup>
        {columns.map((column) => (
          <col key={column.id} style={{ width: column.width }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.id} scope="col" data-align={column.align}>
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
    </>
  );
}

interface TableRowProps<Row> {
  id: string;
  row: Row;
  columns: readonly Column<Row>[];
  selected: boolean;
  tone?: RowTone;
  onSelect?(): void;
}

function TableRow<Row>({
  id,
  row,
  columns,
  selected,
  tone,
  onSelect,
}: TableRowProps<Row>) {
  return (
    <tr id={id} aria-selected={selected} data-tone={tone} onClick={onSelect}>
      {columns.map((column) => (
        <td key={column.id} data-align={column.align}>
          {column.render(row)}
        </td>
      ))}
    </tr>
  );
}
