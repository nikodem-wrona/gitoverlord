import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SAMPLE_SUMMARY } from "@/demo";
import type { DiffTarget, MockCommandHandlers } from "@/ipc";
import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { ChangesPanel } from "./ChangesPanel";

function renderPanel(selected?: DiffTarget) {
  renderWithProviders(
    <ChangesPanel
      title="Working tree"
      repoPath={SAMPLE_SUMMARY.path}
      selected={selected}
      onSelect={() => {}}
    />,
  );
  return screen.findByRole("grid", { name: "Working tree changes" });
}

/** The text of the Stage column in the row of `path`. */
function areaOf(path: string): string | undefined {
  const row = screen.getByTitle(path).closest("tr");
  return row?.querySelectorAll("td")[1]?.textContent ?? undefined;
}

describe("ChangesPanel", () => {
  it("stages and unstages a file with the button of its row", async () => {
    mockRepository();
    await renderPanel();

    fireEvent.click(
      screen.getByRole("button", { name: "Stage docs/ROADMAP.md" }),
    );
    await waitFor(() => expect(areaOf("docs/ROADMAP.md")).toBe("staged"));

    fireEvent.click(
      screen.getByRole("button", { name: "Unstage docs/ROADMAP.md" }),
    );
    await waitFor(() => expect(areaOf("docs/ROADMAP.md")).toBe("unstaged"));
  });

  it("stages each change with Stage all", async () => {
    const stageFiles = vi.fn<MockCommandHandlers["stageFiles"]>(() => null);
    mockRepository({ stageFiles });
    await renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Stage all changes" }));

    await waitFor(() => expect(stageFiles).toHaveBeenCalledOnce());
    expect(stageFiles.mock.calls[0]).toMatchObject([
      {
        files: expect.arrayContaining(["docs/ROADMAP.md", "src/hud/Panel.tsx"]),
      },
    ]);
  });

  it("discards the selected file after a confirmation, and Undo restores it", async () => {
    mockRepository();
    await renderPanel({ kind: "unstaged", path: "docs/ROADMAP.md" });

    fireEvent.click(
      screen.getByRole("button", { name: /Discard the changes of docs/ }),
    );
    const dialog = screen.getByRole("dialog", { name: "Discard changes" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Discard" }));

    expect(await screen.findByText("Changes discarded")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByTitle("docs/ROADMAP.md")).toBeNull(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(await screen.findByTitle("docs/ROADMAP.md")).toBeInTheDocument();
  });

  it("does not discard a conflict", async () => {
    mockRepository();
    await renderPanel({ kind: "unstaged", path: "src/hud/tokens.css" });

    const discard = screen.getByRole("button", {
      name: "Discard the changes of src/hud/tokens.css…",
    });

    expect(discard).toBeDisabled();
    expect(discard).toHaveAttribute("title", expect.stringMatching(/conflict/));
  });
});
