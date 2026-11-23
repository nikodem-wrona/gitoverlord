import type { StatusState } from "@/hud";
import { CommandError, type GitError, type GitVersion } from "@/ipc";

export interface GitStatus {
  state: StatusState;
  value: string;
  /** Tells the user what to do after a failure. */
  hint?: string;
}

interface GitQuery {
  data: GitVersion | undefined;
  error: Error | null;
}

/** Converts the state of the git version query into status line text. */
export function describeGit({ data, error }: GitQuery): GitStatus {
  if (data) return { state: "ok", value: formatVersion(data) };
  if (error) return describeFailure(error);
  return { state: "pending", value: "Scanning" };
}

function formatVersion({ major, minor, patch }: GitVersion): string {
  return `${major}.${minor}.${patch}`;
}

function describeFailure(error: Error): GitStatus {
  if (error instanceof CommandError) return describeGitError(error.detail);
  return {
    state: "fail",
    value: "No response",
    hint: "The backend did not answer. Restart gitoverlord.",
  };
}

function describeGitError(error: GitError): GitStatus {
  switch (error.kind) {
    case "gitNotFound":
      return {
        state: "fail",
        value: "Not found",
        hint: "Install Git, then restart gitoverlord.",
      };
    case "commandFailed":
      return { state: "fail", value: "Failed", hint: error.message };
    case "unexpectedOutput":
      return {
        state: "fail",
        value: "Unknown version",
        hint: `Git printed: ${error.message}`,
      };
  }
}
