import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MockCommandHandlers } from "@/ipc";
import { rejectWith } from "@/test/commandResults";
import { mockRepository } from "@/test/mockRepository";

import { AccountButton } from "./AccountButton";
import { ACCOUNT, CODE, renderWithGitHub } from "./testing";

async function startSignIn() {
  renderWithGitHub(<AccountButton />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Sign in to GitHub" }),
  );
  return screen.getByRole("dialog", { name: "Sign in to GitHub" });
}

describe("SignInDialog", () => {
  it("shows the code, polls, and shows the account", async () => {
    const openGithubPage = vi.fn<MockCommandHandlers["openGithubPage"]>(
      () => null,
    );
    mockRepository({ githubStartSignIn: () => CODE, openGithubPage });
    const dialog = await startSignIn();

    const open = await within(dialog).findByRole("button", {
      name: "Copy the code and open GitHub",
    });
    expect(within(dialog).getByText("WDJB-MJHT")).toBeVisible();
    fireEvent.click(open);
    expect(openGithubPage).toHaveBeenCalledWith({ url: CODE.verificationUri });

    // The demo backend accepts the code at the third poll.
    expect(
      await screen.findByRole("button", { name: "Sign out of GitHub…" }),
    ).toHaveTextContent("@overlord");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows why the sign-in cannot start", async () => {
    mockRepository({
      githubStartSignIn: rejectWith({
        kind: "rejected",
        message: "This build has no GitHub client ID.",
      }),
    });
    const dialog = await startSignIn();

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "This build has no GitHub client ID.",
    );
  });

  it("tells the user when GitHub refuses the access", async () => {
    mockRepository({
      githubStartSignIn: () => CODE,
      githubPollSignIn: () => ({ kind: "denied" }),
    });
    const dialog = await startSignIn();

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "GitHub did not give the access.",
    );
  });

  it("signs out after a question", async () => {
    const githubSignOut = vi.fn<MockCommandHandlers["githubSignOut"]>(
      () => null,
    );
    mockRepository({ githubAccount: () => ACCOUNT, githubSignOut });
    renderWithGitHub(<AccountButton />);

    fireEvent.click(await screen.findByRole("button", { name: /Sign out/ }));
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(
      await screen.findByRole("button", { name: "Sign in to GitHub" }),
    ).toBeVisible();
    expect(githubSignOut).toHaveBeenCalledOnce();
  });
});
