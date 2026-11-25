import type { QueryClient } from "@tanstack/react-query";

import { type Action, defineAction } from "@/actions";
import { commands, type GitHubApp, unwrap } from "@/ipc";

import { githubKeys } from "./queries";

/** The longest client ID that the backend accepts. */
const MAX_LENGTH = 64;
const CLIENT_ID = /^[A-Za-z0-9.]+$/;

/** `true` for an empty text, which gives the built-in app, or a text that can be a client ID. */
export function isClientId(text: string): boolean {
  const id = text.trim();
  return id === "" || (id.length <= MAX_LENGTH && CLIENT_ID.test(id));
}

/** Tells the user which app the sign-in uses. */
export function appDescription(app: GitHubApp): string {
  switch (app.source) {
    case "environment":
      return `GITOVERLORD_GITHUB_CLIENT_ID gives ${app.clientId}. It replaces the saved client ID.`;
    case "saved":
      return `The sign-in uses your app, ${app.clientId}.`;
    case "build":
      return `The sign-in uses the app of this build, ${app.clientId}.`;
    case "builtIn":
      return "The sign-in uses the built-in gitoverlord app.";
  }
}

/** Saves the client ID. An empty text gives the built-in app again. */
export function saveClientIdAction(client: QueryClient, text: string): Action {
  const clientId = text.trim() || null;
  return defineAction({
    id: "github.saveClientId",
    label: clientId ? "Use your GitHub app" : "Use the built-in GitHub app",
    group: "GitHub",
    run: async () => {
      const app = await unwrap(commands.setGithubClientId(clientId));
      client.setQueryData(githubKeys.app, app);
      return {
        title: clientId ? "GitHub app saved" : "Built-in GitHub app restored",
        message:
          "The next sign-in uses it. If you are signed in, sign out and sign in again.",
      };
    },
  });
}
