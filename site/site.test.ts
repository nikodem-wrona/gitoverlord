import { beforeEach, describe, expect, it, vi } from "vitest";

import { expectAccessible } from "@/test/axe";
import { mockReducedMotion } from "@/test/matchMedia";

import installScript from "../install.sh?raw";

import page from "./index.html?raw";
import { startPage } from "./scripts/startPage";

/** Puts the landing page in the document, as a browser without scripts shows it. */
function loadPage(): void {
  const parsed = new DOMParser().parseFromString(page, "text/html");
  document.documentElement.lang = parsed.documentElement.lang;
  document.title = parsed.title;
  document.body.innerHTML = parsed.body.innerHTML;
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.motion;
}

function select<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`The page has no element for ${selector}.`);
  return element;
}

function shownScreens(): string[] {
  const screens = document.querySelectorAll<HTMLElement>("[data-screen]");
  return [...screens].filter((screen) => !screen.hidden).map(({ id }) => id);
}

describe("the landing page", () => {
  beforeEach(loadPage);

  it("is accessible without the scripts", async () => {
    expect(shownScreens()).toHaveLength(4);
    await expectAccessible();
  });

  it("is accessible with the scripts", async () => {
    startPage();
    await expectAccessible();
  });

  it("links to the web demo with a relative address", () => {
    for (const place of [".hero-actions", "#get-started"]) {
      expect(select(`${place} a[href='./demo/']`)).toHaveTextContent(
        "Try the demo",
      );
    }
  });

  it("shows the controls that need a script only after the scripts start", () => {
    expect(select("#calm-mode").closest("label")).not.toBeVisible();
    startPage();
    expect(
      document.querySelectorAll("[data-needs-script][hidden]"),
    ).toHaveLength(0);
  });

  it("shows one screen of the tour, and an arrow key selects the next screen", () => {
    startPage();
    expect(shownScreens()).toEqual(["screen-changes"]);

    const first = select<HTMLButtonElement>("[role='tab']");
    first.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );

    expect(shownScreens()).toEqual(["screen-conflicts"]);
    expect(document.activeElement).toHaveTextContent("Conflicts");
    expect(first).toHaveAttribute("aria-selected", "false");
  });

  it("sets the theme of the page and shows the screenshot of that theme", () => {
    startPage();
    select("[data-theme-option='amber']").click();

    expect(document.documentElement.dataset.theme).toBe("amber");
    expect(select("[data-theme-shot='amber']")).toBeVisible();
    expect(select("[data-theme-shot='overlord']")).not.toBeVisible();
    expect(select("[data-theme-label]")).toHaveTextContent("Amber");
  });

  it("selects the next theme with the button in the status bar", () => {
    startPage();
    const cycle = select("[data-theme-cycle]");
    cycle.click();
    cycle.click();
    expect(document.documentElement.dataset.theme).toBe("mono");
    cycle.click();
    expect(document.documentElement.dataset.theme).toBe("overlord");
  });

  it("keeps calm mode on when the system asks for reduced motion", () => {
    startPage();
    expect(document.documentElement.dataset.motion).toBe("calm");
    expect(select("#calm-mode")).toBeDisabled();
  });

  it("turns calm mode on and off with the checkbox", () => {
    mockReducedMotion(false);
    startPage();
    expect(document.documentElement.dataset.motion).toBe("full");

    select("#calm-mode").click();
    expect(document.documentElement.dataset.motion).toBe("calm");
    expect(select("[data-motion-label]")).toHaveTextContent("Calm");
  });

  it.each([
    [
      "the install command",
      "#install-command",
      "curl -fsSL https://raw.githubusercontent.com/nikodem-wrona/gitoverlord/master/install.sh | sh",
    ],
    [
      "the build commands, one for each line",
      "#build-commands",
      "git clone https://github.com/nikodem-wrona/gitoverlord.git\ncd gitoverlord\npnpm install\npnpm tauri dev",
    ],
  ])("copies %s", async (_name, source, commands) => {
    const writeText = vi.fn<(text: string) => Promise<void>>(() =>
      Promise.resolve(),
    );
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    startPage();

    const button = select(`[data-copy='${source}']`);
    button.click();

    await vi.waitFor(() => expect(button).toHaveTextContent("Copied"));
    expect(writeText).toHaveBeenCalledWith(commands);
    vi.unstubAllGlobals();
  });

  it("shows the install command that the install script gives", () => {
    const command = select("#install-command").textContent.replace(/\s+/g, " ");
    expect(installScript).toContain(command.trim());
  });
});
