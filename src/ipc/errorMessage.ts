import type { GitError } from "./bindings";
import { CommandError } from "./unwrap";

/** Converts the failure of a command into a sentence for the user. */
export function errorMessage(error: unknown): string {
  if (error instanceof CommandError) return describe(error.detail);
  return "The backend did not answer. Restart gitoverlord.";
}

function describe(error: GitError): string {
  switch (error.kind) {
    case "gitNotFound":
      return "Git is not installed.";
    case "notARepository":
      return `This folder is not a git repository: ${error.message}`;
    default:
      return error.message;
  }
}
