import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SAMPLE_SUMMARY } from "@/demo";
import type { MockCommandHandlers } from "@/ipc";
import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { CommitComposer } from "./CommitComposer";

function renderComposer() {
  renderWithProviders(<CommitComposer repoPath={SAMPLE_SUMMARY.path} />);
}

const commitButton = () =>
  screen.getByRole("button", { name: "Commit the staged changes" });
const field = (name: RegExp) => screen.getByRole("textbox", { name });

describe("CommitComposer", () => {
  it("needs a summary before it commits", async () => {
    mockRepository();
    renderComposer();

    expect(await screen.findByText("3 staged")).toBeInTheDocument();
    expect(commitButton()).toBeDisabled();
    expect(commitButton()).toHaveAttribute("title", "Write a summary first.");
  });

  it("commits the staged changes with the summary and the description", async () => {
    const commitChanges = vi.fn<MockCommandHandlers["commitChanges"]>(
      () => "c0ffee1",
    );
    mockRepository({ commitChanges });
    renderComposer();
    await screen.findByText("3 staged");

    fireEvent.change(field(/Summary/), { target: { value: " feat: dock " } });
    fireEvent.change(field(/Description/), { target: { value: "Why." } });
    fireEvent.click(commitButton());

    expect(await screen.findByText("Committed")).toBeInTheDocument();
    expect(commitChanges).toHaveBeenCalledWith(
      expect.objectContaining({ message: "feat: dock\n\nWhy.", amend: false }),
    );
    expect(field(/Summary/)).toHaveValue("");
  });

  it("starts an amend with the message of the last commit", async () => {
    const commitChanges = vi.fn<MockCommandHandlers["commitChanges"]>(
      () => "c0ffee1",
    );
    mockRepository({ commitChanges });
    renderComposer();
    await screen.findByText("3 staged");
    await waitFor(() =>
      expect(screen.getByRole("checkbox", { name: /Amend/ })).toBeEnabled(),
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /Amend/ }));
    await waitFor(() =>
      expect(field(/Summary/)).toHaveValue("feat: add the star map"),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Amend the last commit" }),
    );

    await waitFor(() =>
      expect(commitChanges).toHaveBeenCalledWith(
        expect.objectContaining({ amend: true }),
      ),
    );
  });

  it("commits with the shortcut", async () => {
    const commitChanges = vi.fn<MockCommandHandlers["commitChanges"]>(
      () => "c0ffee1",
    );
    mockRepository({ commitChanges });
    renderComposer();
    await screen.findByText("3 staged");

    fireEvent.change(field(/Summary/), { target: { value: "fix: it" } });
    fireEvent.keyDown(field(/Summary/), { key: "Enter", ctrlKey: true });

    await waitFor(() => expect(commitChanges).toHaveBeenCalledOnce());
  });
});
