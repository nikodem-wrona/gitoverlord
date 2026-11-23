import type { ReactElement } from "react";
import { vi } from "vitest";

import type { Account, DeviceCode } from "@/ipc";
import { renderWithProviders } from "@/test/renderWithProviders";

import { GitHubProvider } from "./GitHubProvider";

export const ACCOUNT: Account = { login: "octocat", name: "Mona" };

/** A code with no wait between the polls. */
export const CODE: DeviceCode = {
  userCode: "WDJB-MJHT",
  verificationUri: "https://github.com/login/device",
  deviceCode: "device-1",
  interval: 0,
  expiresIn: 900,
};

/** Renders `ui` in the GitHub provider. Returns the mock that gets the path of a clone. */
export function renderWithGitHub(ui: ReactElement) {
  const onCloned = vi.fn<(path: string) => void>();
  renderWithProviders(
    <GitHubProvider onCloned={onCloned}>{ui}</GitHubProvider>,
  );
  return onCloned;
}
