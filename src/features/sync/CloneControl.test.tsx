import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { events, type MockCommandHandlers } from "@/ipc";
import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { CloneControl } from "./CloneControl";

const URL = "https://example.com/owner/repo.git";

function mockClone(folder: string | null) {
  const pickFolder = vi.fn<MockCommandHandlers["pickFolder"]>(() => folder);
  const cloneRepository = vi.fn<MockCommandHandlers["cloneRepository"]>(
    () => "/work/repo",
  );
  mockRepository({ pickFolder, cloneRepository });
  return { pickFolder, cloneRepository };
}

function clone(onCloned = vi.fn<(path: string) => void>()) {
  renderWithProviders(<CloneControl onCloned={onCloned} />);
  fireEvent.click(screen.getByRole("button", { name: "Clone a repository…" }));
  const field = screen.getByRole("textbox", { name: "URL of the repository" });
  fireEvent.change(field, { target: { value: URL } });
  fireEvent.submit(field);
  return onCloned;
}

describe("CloneControl", () => {
  it("clones into the selected folder, then opens the clone", async () => {
    const { cloneRepository } = mockClone("/work");

    const onCloned = clone();

    await waitFor(() => expect(onCloned).toHaveBeenCalledWith("/work/repo"));
    expect(cloneRepository).toHaveBeenCalledWith({ url: URL, parent: "/work" });
    expect(await screen.findByText("Repository cloned")).toBeVisible();
  });

  it("does not clone when the user cancels the folder dialog", async () => {
    const { pickFolder, cloneRepository } = mockClone(null);

    const onCloned = clone();

    await waitFor(() => expect(pickFolder).toHaveBeenCalledOnce());
    await act(() => Promise.resolve());
    expect(cloneRepository).not.toHaveBeenCalled();
    expect(onCloned).not.toHaveBeenCalled();
  });

  it("shows the progress of a clone", async () => {
    mockRepository();
    renderWithProviders(<CloneControl onCloned={() => {}} />);
    const step = { phase: "Receiving objects", percent: 30 };

    const meter = await waitFor(async () => {
      await act(() =>
        events.syncProgress.emit({
          path: "/work/repo",
          operation: "clone",
          step,
        }),
      );
      return screen.getByRole("meter", { name: "Clone" });
    });

    expect(meter).toHaveAttribute("aria-valuenow", "30");
  });
});
