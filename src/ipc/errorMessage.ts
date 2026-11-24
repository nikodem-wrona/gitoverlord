import type { GitError } from "./bindings";
import { CommandError } from "./unwrap";

/** gitoverlord does not ask for passwords. The system gives the credentials to git. */
const SIGN_IN_HINT =
  "For HTTPS, set up a git credential helper. For SSH, add your key to the SSH agent and connect one time in a terminal to accept the host key.";

/** Converts the failure of a command into a sentence for the user. */
export function errorMessage(error: unknown): string {
  if (error instanceof CommandError) return gitErrorText(error.detail);
  return "The backend did not answer. Restart gitoverlord.";
}

/** Converts a `GitError` into a sentence for the user. */
export function gitErrorText(error: GitError): string {
  switch (error.kind) {
    case "gitNotFound":
      return "Git is not installed.";
    case "notARepository":
      return `This folder is not a git repository: ${error.message}`;
    case "authFailed":
      return `The remote refused the sign-in. ${SIGN_IN_HINT} Git said: ${error.message}`;
    case "signInExpired":
      return "The GitHub sign-in is not valid any more. Sign in again.";
    default:
      return error.message;
  }
}
