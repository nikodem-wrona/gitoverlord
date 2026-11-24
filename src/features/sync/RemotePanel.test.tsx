import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SAMPLE_SUMMARY } from "@/demo";
import type { MockCommandHandlers } from "@/ipc";
import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { RemotePanel } from "./RemotePanel";

const PATH = SAMPLE_SUMMARY.path;

function renderPanel() {
  renderWithProviders(<RemotePanel title="Remote links" repoPath={PATH} />);
}

describe("RemotePanel", () => {
  it("lists the remotes with the count of their branches", async () => {
    mockRepository();
    renderPanel();

    const grid = await screen.findByRole("grid", { name: "Remotes" });
    const origin = within(grid).getByText("origin").closest("tr");
    expect(origin).toHaveTextContent(
      "https://github.com/gitoverlord/gitoverlord.git",
    );
    expect(origin).toHaveTextContent("4");
    const add = screen.getByRole("button", { name: "Add the remote origin…" });
    expect(add).toBeDisabled();
  });

  it("adds the remote origin", async () => {
    const addRemote = vi.fn<MockCommandHandlers["addRemote"]>(() => null);
    mockRepository({ repoRemotes: () => [], addRemote });
    renderPanel();
    expect(await screen.findByText("No remotes")).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "Add the remote origin…" }),
    );
    const field = screen.getByRole("textbox", {
      name: "URL of the remote repository",
    });
    fireEvent.change(field, { target: { value: "https://example.com/a.git" } });
    fireEvent.submit(field);

    await waitFor(() =>
      expect(addRemote).toHaveBeenCalledWith({
        path: PATH,
        name: "origin",
        url: "https://example.com/a.git",
      }),
    );
  });
});
