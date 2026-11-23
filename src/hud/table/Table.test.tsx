import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { textColumn } from "./columns";
import { Table } from "./Table";

interface Row {
  id: string;
  name: string;
  alert?: boolean;
}

const ROWS: Row[] = [
  { id: "a", name: "Alpha" },
  { id: "b", name: "Bravo", alert: true },
  { id: "c", name: "Charlie" },
];

const COLUMNS = [textColumn<Row>("name", "Name")];

function Harness() {
  const [selected, setSelected] = useState<string>();
  return (
    <Table
      label="Test table"
      columns={COLUMNS}
      rows={ROWS}
      getRowKey={(row) => row.id}
      selectedKey={selected}
      onSelect={setSelected}
      getRowTone={(row) => (row.alert ? "alert" : undefined)}
    />
  );
}

function rowOf(text: string): HTMLElement {
  const row = screen.getByText(text).closest("tr");
  if (!row) throw new Error(`No row holds ${text}.`);
  return row;
}

describe("Table", () => {
  it("shows the headers and the cells", () => {
    render(<Harness />);

    expect(
      screen.getByRole("columnheader", { name: "Name" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("selects a row on click", () => {
    render(<Harness />);

    fireEvent.click(screen.getByText("Bravo"));

    expect(rowOf("Bravo")).toHaveAttribute("aria-selected", "true");
    expect(rowOf("Alpha")).toHaveAttribute("aria-selected", "false");
  });

  it("moves the selection with the arrow keys and Home and End", () => {
    render(<Harness />);
    const grid = screen.getByRole("grid", { name: "Test table" });

    fireEvent.keyDown(grid, { key: "ArrowDown" });
    expect(rowOf("Alpha")).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(grid, { key: "End" });
    expect(rowOf("Charlie")).toHaveAttribute("aria-selected", "true");
    expect(grid).toHaveAttribute("aria-activedescendant", rowOf("Charlie").id);
  });

  it("marks the tone of a row", () => {
    render(<Harness />);

    expect(rowOf("Bravo")).toHaveAttribute("data-tone", "alert");
    expect(rowOf("Alpha")).not.toHaveAttribute("data-tone");
  });
});
