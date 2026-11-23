import type { GitError } from "./bindings";

/** The result of a generated command. */
export type CommandResult<T> =
  { status: "ok"; data: T } | { status: "error"; error: GitError };

/** The error that `unwrap` throws when a command returns a failure. */
export class CommandError extends Error {
  readonly detail: GitError;

  constructor(detail: GitError) {
    super(`The command failed: ${detail.kind}`);
    this.name = "CommandError";
    this.detail = detail;
  }
}

/**
 * Returns the data of a command, or throws a `CommandError`.
 *
 * TanStack Query needs a query function that throws on failure.
 */
export async function unwrap<T>(result: Promise<CommandResult<T>>): Promise<T> {
  const settled = await result;
  if (settled.status === "error") throw new CommandError(settled.error);
  return settled.data;
}
