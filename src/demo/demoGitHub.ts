import type {
  Account,
  CreatedPull,
  DeviceCode,
  HubRepository,
  PullList,
  PullRequest,
  SignInStep,
} from "@/ipc";

import { currentBranch, type DemoRepository, reject } from "./demoRepository";

const DEMO_ACCOUNT: Account = { login: "overlord", name: "Demo Overlord" };
const PAGE = "https://github.com/gitoverlord/gitoverlord";
/** The demo sign-in finishes at this poll. */
const DONE_AT_POLL = 3;

/** The GitHub state of the demo. The user starts signed out. */
export interface DemoGitHub {
  account: Account | null;
  polls: number;
  pulls: PullRequest[];
}

function pull(
  number: number,
  title: string,
  head: string,
  extra: Partial<PullRequest>,
): PullRequest {
  return {
    number,
    title,
    url: `${PAGE}/pull/${number}`,
    author: "cipher",
    head,
    base: "main",
    draft: false,
    updatedAt: "2026-11-23T11:20:00Z",
    checks: "passing",
    ...extra,
  };
}

export function createDemoGitHub(): DemoGitHub {
  return {
    account: null,
    polls: 0,
    pulls: [
      pull(42, "feat: add the HUD kit", "feat/hud-kit", {}),
      pull(41, "spike: sweep the radar", "spike/radar", {
        draft: true,
        checks: "pending",
        author: "nova",
      }),
      pull(39, "fix: embed the Windows manifest", "fix/windows-ci", {
        checks: "failing",
        author: "ghost",
        updatedAt: "2026-11-22T20:58:00Z",
      }),
    ],
  };
}

export const DEMO_DEVICE_CODE: DeviceCode = {
  userCode: "WDJB-MJHT",
  verificationUri: "https://github.com/login/device",
  deviceCode: "demo-device-code",
  interval: 1,
  expiresIn: 900,
};

export const DEMO_HUB_REPOSITORIES: HubRepository[] = [
  {
    fullName: "gitoverlord/gitoverlord",
    cloneUrl: `${PAGE}.git`,
    private: false,
    description: "An open-source desktop Git client",
  },
  {
    fullName: "overlord/star-charts",
    cloneUrl: "https://github.com/overlord/star-charts.git",
    private: true,
    description: "Charts of the stars",
  },
  {
    fullName: "overlord/dotfiles",
    cloneUrl: "https://github.com/overlord/dotfiles.git",
    private: false,
    description: null,
  },
];

/** Finishes the sign-in at the third poll, like a user who types the code. */
export function pollSignIn(hub: DemoGitHub): SignInStep {
  hub.polls += 1;
  if (hub.polls < DONE_AT_POLL) return { kind: "pending" };
  hub.account = DEMO_ACCOUNT;
  return { kind: "done", account: DEMO_ACCOUNT };
}

/** The panel reads the list only after a sign-in, so the demo does not check the account. */
export function pullList(hub: DemoGitHub): PullList {
  return structuredClone({
    repository: { owner: "gitoverlord", name: "gitoverlord" },
    defaultBranch: "main",
    pulls: hub.pulls,
  });
}

export function createPull(
  hub: DemoGitHub,
  repo: DemoRepository,
  title: string,
  base: string,
): CreatedPull | Promise<never> {
  const branch = currentBranch(repo);
  if (!branch?.upstream) return reject("Publish the branch to origin first.");
  const number = Math.max(...hub.pulls.map((entry) => entry.number)) + 1;
  const created = pull(number, title, branch.name, {
    base,
    author: hub.account?.login ?? "you",
    checks: "pending",
    updatedAt: new Date().toISOString(),
  });
  hub.pulls.unshift(created);
  return { number, url: created.url };
}

/** The browser demo opens the page in a new tab. */
export function openPage(url: string): null {
  window.open(url, "_blank", "noopener");
  return null;
}
