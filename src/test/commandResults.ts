import type { GitError } from "@/ipc";

/**
 * Makes a mock command handler that fails with `error`.
 *
 * The backend rejects with a plain value, not with an `Error` object.
 */
export function rejectWith(error: GitError): () => Promise<never> {
  return () => Promise.reject(error);
}

/** A mock command handler that stays pending. */
export function neverSettles(): Promise<never> {
  return new Promise(() => {});
}
