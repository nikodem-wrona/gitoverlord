import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type AppUpdate, type MockCommandHandlers, mockCommands } from "@/ipc";
import { rejectWith } from "@/test/commandResults";
import { renderWithProviders } from "@/test/renderWithProviders";

import { APP_VERSION } from "./queries";
import { UpdateStatus } from "./UpdateStatus";

const UPDATE: AppUpdate = { version: "9.0.0", currentVersion: APP_VERSION };

describe("UpdateStatus", () => {
  it("shows the version when this version is the newest", async () => {
    mockCommands({ checkForUpdate: () => null });

    renderWithProviders(<UpdateStatus />);

    expect(await screen.findByText(`Version ${APP_VERSION}`)).toBeVisible();
  });

  it("shows the version when the check fails", async () => {
    const message = "the release server did not answer";
    mockCommands({ checkForUpdate: rejectWith({ kind: "service", message }) });

    renderWithProviders(<UpdateStatus />);

    expect(await screen.findByText(`Version ${APP_VERSION}`)).toBeVisible();
  });

  it("installs the update after a question", async () => {
    const installUpdate = vi.fn<MockCommandHandlers["installUpdate"]>(
      () => null,
    );
    mockCommands({ checkForUpdate: () => UPDATE, installUpdate });
    renderWithProviders(<UpdateStatus />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Update to 9.0.0" }),
    );
    const dialog = await screen.findByRole("dialog");
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
