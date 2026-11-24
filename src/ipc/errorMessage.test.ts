import { describe, expect, it } from "vitest";

import { errorMessage } from "./errorMessage";
import { CommandError } from "./unwrap";

describe("errorMessage", () => {
  it("gives the message of the backend", () => {
    const error = new CommandError({ kind: "readFailed", message: "bad ref" });

    expect(errorMessage(error)).toBe("bad ref");
  });

  it("names the folder that is not a repository", () => {
    const error = new CommandError({ kind: "notARepository", message: "/tmp" });

    expect(errorMessage(error)).toBe(
      "This folder is not a git repository: /tmp",
    );
  });

  it("tells the user how to give git the credentials", () => {
    const error = new CommandError({
      kind: "authFailed",
      message: "Permission denied (publickey).",
    });

    expect(errorMessage(error)).toMatch(/credential helper.*SSH agent/);
    expect(errorMessage(error)).toMatch(/Permission denied \(publickey\)/);
  });

  it("tells the user to restart when the backend is silent", () => {
    expect(errorMessage(new TypeError("no IPC"))).toMatch(/restart/i);
  });
});
