import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SAMPLE_SUMMARY, SAMPLE_WORKING_TREE } from "@/demo";
import { events } from "@/ipc";
import { rejectWith } from "@/test/commandResults";
import { mockRepository } from "@/test/mockRepository";
import { renderWithProviders } from "@/test/renderWithProviders";

import { AppShell } from "./AppShell";

/** Renders the shell and waits until the last repository is open. */
async function renderOpenShell() {
  renderWithProviders(<AppShell />);
  await screen.findByRole("grid", { name: "Commit log" });
}

async function openTab(name: string) {
  fireEvent.click(screen.getByRole("tab", { name }));
  await screen.findByRole("tab", { name, selected: true });
}

describe("AppShell with a repository", () => {
  it("opens the last repository on the commit log, with HEAD in the inspector", async () => {
    mockRepository();

    await renderOpenShell();

    expect(screen.getByRole("tab", { name: "History" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      await screen.findByRole("heading", { name: "feat: add the star map" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("feat/hud-kit").length).toBeGreaterThan(0);
  });

  it("shows the commit that the user selects in the inspector", async () => {
    mockRepository();
    await renderOpenShell();

    fireEvent.click(screen.getByText("fix: embed the windows manifest"));

    expect(
      await screen.findByRole("heading", {
        name: "fix: embed the windows manifest",
      }),
    ).toBeInTheDocument();
  });

  it("shows the working tree on the Changes tab, with conflicts as alerts", async () => {
    mockRepository();
    await renderOpenShell();

    await openTab("Changes");

    expect(
      await screen.findByRole("grid", { name: "Working tree changes" }),
    ).toBeInTheDocument();
    expect(
      screen.getByTitle("src/hud/tokens.css").closest("tr"),
    ).toHaveAttribute("data-tone", "alert");
  });

  it("opens the diff of a changed file, and closes it with the Escape key", async () => {
    mockRepository();
    await renderOpenShell();
    await openTab("Changes");

    fireEvent.click(await screen.findByTitle("src/hud/Panel.tsx"));

    expect(
      await screen.findByRole("group", { name: "Diff of src/hud/Panel.tsx" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /commit graph/i })).toBeNull();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(
      screen.getByRole("img", { name: /commit graph/i }),
    ).toBeInTheDocument();
  });

  it("opens the diff of a file of the selected commit", async () => {
    mockRepository();
    await renderOpenShell();

    fireEvent.click(
      await screen.findByTitle("src/features/history/StarMap.tsx"),
    );

    expect(
      await screen.findByText("const REVEAL_DELAY = 120;"),
    ).toBeInTheDocument();
    expect(screen.getByText("Commit b7e41c9")).toBeInTheDocument();
  });

  it("reads the working tree again when the backend reports a change", async () => {
    let tree = SAMPLE_WORKING_TREE;
    mockRepository({ repoStatus: () => tree });
    await renderOpenShell();
    await openTab("Changes");
    await screen.findByTitle("src/hud/Panel.tsx");

    tree = { staged: [], unstaged: [] };
    await act(() =>
      events.repoChanged.emit({
        path: SAMPLE_SUMMARY.path,
        change: { refs: false, files: true },
      }),
    );

    expect(await screen.findByText("Working tree clean")).toBeInTheDocument();
  });

  it("asks for a GitHub sign-in on the pull requests tab", async () => {
    mockRepository();
    await renderOpenShell();

    await openTab("Pull requests");

    expect(await screen.findByText("Not signed in")).toBeInTheDocument();
  });

  it("pushes the current branch from the top bar", async () => {
    mockRepository();
    await renderOpenShell();

    const push = screen.getByRole("button", { name: "Push to the upstream" });
    await waitFor(() => expect(push).toHaveTextContent("Push ↑3"));
    fireEvent.click(push);

    // The demo push takes a few steps, then the counts read again.
    await waitFor(() => expect(push).toHaveTextContent("Push ↑0"));
    expect(screen.getAllByText("Push complete")).not.toHaveLength(0);
  });

  it("goes back to the list of repositories", async () => {
    mockRepository();
    await renderOpenShell();

    fireEvent.click(screen.getByRole("button", { name: "Repositories" }));

    expect(
      screen.getByRole("grid", { name: "Recent repositories" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("~/dev/star-charts"));

    expect(
      await screen.findByRole("grid", { name: "Commit log" }),
    ).toBeInTheDocument();
  });
});

describe("AppShell without a repository", () => {
  it("shows the dock, and opens the folder that the user selects", async () => {
    mockRepository({ recentRepositories: () => [] });
    renderWithProviders(<AppShell />);

    expect(
      await screen.findByText("No recent repositories"),
    ).toBeInTheDocument();
    expect(screen.getByText("No link")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open a folder" }));

    expect(
      await screen.findByRole("grid", { name: "Commit log" }),
    ).toBeInTheDocument();
  });

  it("stays on the dock when the user cancels the folder dialog", async () => {
    mockRepository({
      recentRepositories: () => [],
      pickFolder: () => null,
      openRepository: rejectWith({ kind: "io", message: "not expected" }),
    });
    renderWithProviders(<AppShell />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Open a folder" }),
    );
    await act(() => Promise.resolve());

    expect(screen.getByText("Select a repository")).toBeInTheDocument();
    expect(screen.queryByText("Repository link failed")).toBeNull();
  });

  it("tells the user when the folder is not a repository", async () => {
    mockRepository({
      recentRepositories: () => [],
      openRepository: rejectWith({ kind: "notARepository", message: "/tmp" }),
    });
    renderWithProviders(<AppShell />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Open a folder" }),
    );

    expect(
      await screen.findByText("Repository link failed"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This folder is not a git repository: /tmp"),
    ).toBeInTheDocument();
  });
});
