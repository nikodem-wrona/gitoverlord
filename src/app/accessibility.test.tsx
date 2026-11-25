import { fireEvent, screen } from "@testing-library/react";
import { describe, it } from "vitest";

import { expectAccessible } from "@/test/axe";
import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { AppShell } from "./AppShell";
import { MODULE_LIST } from "./modules";

async function renderOpenShell() {
  mockRepository();
  renderWithProviders(<AppShell />);
  await screen.findByRole("grid", { name: "Commit log" });
}

async function openTab(name: string) {
  fireEvent.click(screen.getByRole("tab", { name }));
  await screen.findByRole("tab", { name, selected: true });
}

/** Each screen of the application must pass the WCAG 2.1 AA rules of axe. */
describe("accessibility", () => {
  it("has no axe violations on the start screen", async () => {
    mockRepository({ recentRepositories: () => [] });
    renderWithProviders(<AppShell />);
    await screen.findByRole("button", { name: /open/i });

    await expectAccessible();
  });

  it.each(MODULE_LIST.map((module) => [module.label]))(
    "has no axe violations on the %s tab",
    async (label) => {
      await renderOpenShell();
      await openTab(label);

      await expectAccessible();
    },
  );

  it("has no axe violations in the command palette", async () => {
    await renderOpenShell();

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    await screen.findByRole("textbox", { name: "Search the commands" });

    await expectAccessible();
  });

  it("has no axe violations in the options", async () => {
    await renderOpenShell();

    fireEvent.click(screen.getByRole("button", { name: "Options" }));
    await screen.findByRole("textbox", { name: "Client ID" });

    await expectAccessible();
  });

  it("has no axe violations in the diff viewer and a confirmation", async () => {
    await renderOpenShell();
    await openTab("Changes");
    fireEvent.click(await screen.findByTitle("src/hud/Panel.tsx"));
    await screen.findByRole("group", { name: "Diff of src/hud/Panel.tsx" });
    await expectAccessible();

    fireEvent.click(
      screen.getByRole("button", { name: /Discard the changes of/ }),
    );
    await screen.findByRole("dialog", { name: "Discard changes" });
    await expectAccessible();
  });

  it("has no axe violations in the context menu of a commit", async () => {
    await renderOpenShell();

    // Each commit of the timeline has an SVG title with its hash and subject.
    const titles = [...document.querySelectorAll("title")];
    const mark = titles.find((title) => title.textContent?.startsWith("a91f"));
    fireEvent.contextMenu(mark?.parentElement as Element);
    await screen.findByRole("menu");

    await expectAccessible();
  });
});
