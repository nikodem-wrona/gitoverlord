import type { ReactNode } from "react";

export interface Column<Row> {
  id: string;
  /** The name of the column. A screen reader reads it for each cell. */
  header: string;
  /** A shorter text for the header cell, for example `+`. An empty text shows nothing. */
  shortHeader?: string;
  render(row: Row): ReactNode;
  /** A CSS width, for example `6rem`. Columns without a width share the free space. */
  width?: string;
  align?: "start" | "end";
}

type ColumnOptions = Pick<Column<unknown>, "width" | "align" | "shortHeader">;

/** Makes a column that shows one field of the row as text. */
export function textColumn<Row>(
  key: keyof Row & string,
  header: string,
  options: ColumnOptions = {},
): Column<Row> {
  return { id: key, header, render: (row) => String(row[key]), ...options };
}
