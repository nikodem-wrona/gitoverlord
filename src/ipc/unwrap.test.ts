import { describe, expect, it } from "vitest";

import { CommandError, unwrap } from "./unwrap";

describe("unwrap", () => {
  it("returns the data of a successful command", async () => {
    const result = Promise.resolve({ status: "ok" as const, data: 42 });

    await expect(unwrap(result)).resolves.toBe(42);
  });

  it("throws a CommandError that holds the failure", async () => {
    const error = { kind: "commandFailed" as const, message: "fatal: no" };
    const result = Promise.resolve({ status: "error" as const, error });

    const thrown = await unwrap(result).catch((reason: unknown) => reason);

    expect(thrown).toBeInstanceOf(CommandError);
    expect((thrown as CommandError).detail).toEqual(error);
  });
});
