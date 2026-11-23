import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { TabPanel, Tabs } from "./Tabs";

const TABS = [
  { id: "one", label: "One" },
  { id: "two", label: "Two" },
  { id: "three", label: "Three" },
];

function Harness() {
  const [active, setActive] = useState("one");
  return (
    <>
      <Tabs
        label="Test tabs"
        idPrefix="test"
        tabs={TABS}
        activeId={active}
        onChange={setActive}
      />
      <TabPanel idPrefix="test" activeId={active}>
        Panel {active}
      </TabPanel>
    </>
  );
}

describe("Tabs", () => {
  it("marks the active tab and names the panel after it", () => {
    render(<Harness />);

    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tabpanel", { name: "One" })).toHaveTextContent(
      "Panel one",
    );
  });

  it("selects a tab on click", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("tab", { name: "Three" }));

    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel three");
  });

  it("moves with the arrow keys and focuses the new tab", () => {
    render(<Harness />);
    const first = screen.getByRole("tab", { name: "One" });
    first.focus();

    fireEvent.keyDown(first, { key: "ArrowRight" });

    const second = screen.getByRole("tab", { name: "Two" });
    expect(second).toHaveAttribute("aria-selected", "true");
    expect(second).toHaveFocus();
  });

  it("keeps only the active tab in the tab order", () => {
    render(<Harness />);

    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });
});
