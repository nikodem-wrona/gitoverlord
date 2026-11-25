import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { GitHubApp, MockCommandHandlers } from "@/ipc";
import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { OptionsButton } from "./OptionsButton";
import { OptionsProvider } from "./OptionsProvider";

const SAVED: GitHubApp = {
  clientId: "Iv1.8a61f9b3a7aba766",
  source: "saved",
  saved: "Iv1.8a61f9b3a7aba766",
};

function mockSave() {
  return vi.fn<MockCommandHandlers["setGithubClientId"]>(({ clientId }) => ({
    clientId: clientId ?? "Ov23liOLVhEKbxsuo0TU",
    source: clientId ? "saved" : "builtIn",
    saved: clientId,
  }));
}

async function openOptions() {
  renderWithProviders(
    <OptionsProvider>
      <OptionsButton />
    </OptionsProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Options" }));
  const dialog = screen.getByRole("dialog", { name: "Options" });
  await within(dialog).findByRole("textbox", { name: "Client ID" });
  return dialog;
}

describe("OptionsDialog", () => {
  it("saves the client ID of the GitHub app of the user", async () => {
    const setGithubClientId = mockSave();
    mockRepository({ setGithubClientId });
    const dialog = await openOptions();
    expect(dialog).toHaveTextContent("uses the built-in gitoverlord app");

    fireEvent.change(
      within(dialog).getByRole("textbox", { name: "Client ID" }),
      {
        target: { value: " Iv1.8a61f9b3a7aba766 " },
      },
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(await screen.findByText("GitHub app saved")).toBeVisible();
    expect(setGithubClientId).toHaveBeenCalledWith({
      clientId: "Iv1.8a61f9b3a7aba766",
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("refuses a text that is not a client ID", async () => {
    mockRepository();
    const dialog = await openOptions();

    fireEvent.change(
      within(dialog).getByRole("textbox", { name: "Client ID" }),
      {
        target: { value: "not an id" },
      },
    );

    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "only letters, digits, and dots",
    );
    expect(within(dialog).getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("gives the built-in app again", async () => {
    const setGithubClientId = mockSave();
    mockRepository({ githubApp: () => SAVED, setGithubClientId });
    const dialog = await openOptions();
    expect(
      within(dialog).getByRole("textbox", { name: "Client ID" }),
    ).toHaveValue(SAVED.clientId);

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Use the built-in app" }),
    );

    expect(
      await screen.findByText("Built-in GitHub app restored"),
    ).toBeVisible();
    expect(setGithubClientId).toHaveBeenCalledWith({ clientId: null });
  });

  it("tells the user that the variable replaces the saved client ID", async () => {
    mockRepository({
      githubApp: () => ({
        ...SAVED,
        clientId: "Ov23env",
        source: "environment",
      }),
    });
    const dialog = await openOptions();

    expect(dialog).toHaveTextContent(
      "GITOVERLORD_GITHUB_CLIENT_ID gives Ov23env",
    );
  });

  it("opens with the shortcut", async () => {
    mockRepository();
    renderWithProviders(<OptionsProvider>{null}</OptionsProvider>);

    fireEvent.keyDown(window, { key: ",", ctrlKey: true });

    expect(
      await screen.findByRole("dialog", { name: "Options" }),
    ).toBeVisible();
  });
});
