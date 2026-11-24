import type { Column } from "./columns";

/** `alert` marks a row that needs attention. `highlight` marks a special row. */
export type RowTone = "alert" | "highlight";

export function TableHead<Row>({
  columns,
}: {
  columns: readonly Column<Row>[];
}) {
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
              <HeaderText column={column} />
            </th>
          ))}
        </tr>
      </thead>
    </>
  );
}

/** The header, or its short text on the screen and the full name for a screen reader. */
function HeaderText<Row>({ column }: { column: Column<Row> }) {
  if (column.shortHeader === undefined) return column.header;
  return (
    <>
      <span aria-hidden="true">{column.shortHeader}</span>
      <span className="visually-hidden">{column.header}</span>
    </>
  );
}

interface TableRowProps<Row> {
  id: string;
  /** The position of the row in the full list. */
  index: number;
  row: Row;
  columns: readonly Column<Row>[];
  selected: boolean;
  tone?: RowTone;
  onSelect?(): void;
}

export function TableRow<Row>(props: TableRowProps<Row>) {
  const { id, index, row, columns, selected, tone, onSelect } = props;
  return (
    <tr
      id={id}
      data-row={index % 2 === 0 ? "even" : "odd"}
      aria-rowindex={index + 1}
      aria-selected={selected}
      data-tone={tone}
      onClick={onSelect}
    >
      {columns.map((column) => (
        <td key={column.id} data-align={column.align}>
          {column.render(row)}
        </td>
      ))}
    </tr>
  );
}

/** Takes the height of the rows that are not rendered. */
export function TableSpacer({
  height,
  span,
}: {
  height: number;
  span: number;
}) {
  if (height <= 0) return null;
  return (
    <tr aria-hidden="true" style={{ height }}>
      <td colSpan={span} />
    </tr>
  );
}
