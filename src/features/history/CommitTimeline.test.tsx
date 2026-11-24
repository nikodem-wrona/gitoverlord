import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type Action, defineAction } from "@/actions";
import { SAMPLE_COMMITS } from "@/demo";
import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { assignLanes } from "./assignLanes";
import { CommitTimeline } from "./CommitTimeline";

const COMMITS = assignLanes(SAMPLE_COMMITS);
const [NEWEST, OLDER] = COMMITS;

function renderTimeline(commitMenu?: (hash: string) => Action[]) {
  const onSelect = vi.fn<(hash: string) => void>();
  renderWithProviders(
    <CommitTimeline
      commits={COMMITS}
      selectedHash={NEWEST?.hash}
      onSelect={onSelect}
      commitMenu={commitMenu}
    />,
  );
  return onSelect;
}

describe("CommitTimeline", () => {
  it("selects an older commit with the left arrow key", () => {
    mockRepository();
    const onSelect = renderTimeline();

    const graph = screen.getByRole("group", { name: "Commit graph" });
    fireEvent.keyDown(graph, { key: "ArrowLeft" });

    expect(onSelect).toHaveBeenCalledWith(OLDER?.hash);
  });

  it("opens the commands of a commit on a right-click", async () => {
    mockRepository();
    const run = vi.fn<() => void>();
    const pick = defineAction({
      id: "test.pick",
      label: "Cherry-pick it",
      group: "History",
      run,
    });
    const onSelect = renderTimeline(() => [pick]);

    // Each commit mark has an SVG title with its hash and subject.
    const titles = [...document.querySelectorAll("title")];
    const mark = titles.find((title) =>
      title.textContent?.startsWith("a91f3d2"),
    );
    fireEvent.contextMenu(mark?.parentElement as Element);
    fireEvent.click(screen.getByRole("menuitem", { name: "Cherry-pick it" }));

    expect(onSelect).toHaveBeenCalledWith("a91f3d2");
    await waitFor(() => expect(run).toHaveBeenCalled());
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens the commands of the selected commit with Shift+F10", () => {
    mockRepository();
    const pick = defineAction({
      id: "test.pick",
      label: "Cherry-pick it",
      group: "History",
      run: () => {},
    });
    renderTimeline(() => [pick]);

    const graph = screen.getByRole("group", { name: "Commit graph" });
    fireEvent.keyDown(graph, { key: "F10", shiftKey: true });

    expect(
      screen.getByRole("menu", { name: `Commands for ${NEWEST?.hash}` }),
    ).toBeInTheDocument();
  });
});
