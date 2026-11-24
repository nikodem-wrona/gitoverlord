import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type AppUpdate, type MockCommandHandlers, mockCommands } from "@/ipc";
import { renderWithProviders } from "@/test/renderWithProviders";

import { APP_VERSION } from "./queries";
import { useUpdateActions } from "./updateActions";
import { UpdateStatus } from "./UpdateStatus";

const UPDATE: AppUpdate = { version: "9.0.0", currentVersion: APP_VERSION };

function Harness() {
  useUpdateActions();
  return <UpdateStatus />;
}

/** Opens the command palette when the first check is done, then types `query`. */
async function searchPalette(query: string) {
  await screen.findByRole("button", { name: "Update to 9.0.0" });
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  const search = screen.getByRole("textbox", { name: "Search the commands" });
  fireEvent.change(search, { target: { value: query } });
  return search;
}

describe("the update commands in the command palette", () => {
  it("finds the two commands with the word update", async () => {
    mockCommands({ checkForUpdate: () => UPDATE });
    renderWithProviders(<Harness />);

    await searchPalette("update");

    const names = screen.getAllByRole("option").map((item) => item.textContent);
    expect(names).toHaveLength(2);
    expect(names[0]).toContain("Check for updates");
    expect(names[1]).toContain("Update gitoverlord to 9.0.0…");
  });

  it("checks, asks, and then installs the update", async () => {
    const installUpdate = vi.fn<MockCommandHandlers["installUpdate"]>(
      () => null,
    );
    mockCommands({ checkForUpdate: () => UPDATE, installUpdate });
    renderWithProviders(<Harness />);

    fireEvent.keyDown(await searchPalette("check"), { key: "Enter" });
    const dialog = await screen.findByRole("dialog", {
      name: "Install gitoverlord 9.0.0",
    });
    expect(screen.getByText("gitoverlord 9.0.0 is available")).toBeVisible();
    expect(installUpdate).not.toHaveBeenCalled();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Install and restart" }),
    );

    expect(
      await screen.findByText("Installed gitoverlord 9.0.0"),
    ).toBeVisible();
    expect(installUpdate).toHaveBeenCalledTimes(1);
  });
});
