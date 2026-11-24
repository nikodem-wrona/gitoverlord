import { type QueryClient, useQueryClient } from "@tanstack/react-query";

import { type CommandResult, type RepoChange, unwrap } from "@/ipc";

import { refreshRepository } from "./refreshRepository";

/** A change of the working tree or of the index. The history stays. */
export const FILES_CHANGED: RepoChange = { refs: false, files: true };
const ALL_CHANGED: RepoChange = { refs: true, files: true };

/** Changes one repository. Actions take it to run their commands. */
export interface RepoWriter {
  path: string;
  /**
   * Runs a write command and returns its data, or throws a `CommandError`.
   *
   * Then the queries read the parts that `change` names again, also after a failure.
   */
  write<T>(command: Promise<CommandResult<T>>, change?: RepoChange): Promise<T>;
}

export function useRepoWriter(path: string): RepoWriter {
  const client = useQueryClient();
  return {
    path,
    write: (command, change = ALL_CHANGED) =>
      writeThenRefresh(client, path, command, change),
  };
}

async function writeThenRefresh<T>(
  client: QueryClient,
  path: string,
  command: Promise<CommandResult<T>>,
  change: RepoChange,
): Promise<T> {
  try {
    return await unwrap(command);
  } finally {
    refreshRepository(client, path, change);
  }
}
