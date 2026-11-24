import { describe, expect, it } from "vitest";

import { createQueryClient } from "@/app/queryClient";
import { mockCommands } from "@/ipc";
import { rejectWith } from "@/test/commandResults";

import { APP_VERSION, updateKeys } from "./queries";
import { checkUpdateAction } from "./updateActions";

describe("checkUpdateAction", () => {
  it("reports that this version is the newest", async () => {
    mockCommands({ checkForUpdate: () => null });
    const client = createQueryClient();

    const outcome = await checkUpdateAction(client).run("");

    expect(outcome).toMatchObject({ title: "gitoverlord is up to date" });
    expect(outcome?.message).toBe(APP_VERSION);
    expect(client.getQueryData(updateKeys.check)).toBeNull();
  });

  it("reports a newer version and keeps it for the status bar", async () => {
    const update = { version: "9.0.0", currentVersion: APP_VERSION };
    mockCommands({ checkForUpdate: () => update });
    const client = createQueryClient();

    const outcome = await checkUpdateAction(client).run("");

    expect(outcome).toMatchObject({ title: "gitoverlord 9.0.0 is available" });
    expect(client.getQueryData(updateKeys.check)).toEqual(update);
  });

  it("gives the install action as the action that follows", async () => {
    const update = { version: "9.0.0", currentVersion: APP_VERSION };
    mockCommands({ checkForUpdate: () => update });

    const outcome = await checkUpdateAction(createQueryClient()).run("");

    expect(outcome?.next).toMatchObject({
      id: "application.installUpdate",
      label: "Update gitoverlord to 9.0.0…",
      confirm: { confirm: "Install and restart" },
    });
  });

  it("fails when a development build checks", async () => {
    const message = "A development build does not update.";
    mockCommands({ checkForUpdate: rejectWith({ kind: "rejected", message }) });

    await expect(
      checkUpdateAction(createQueryClient()).run(""),
    ).rejects.toMatchObject({ detail: { kind: "rejected", message } });
  });
});
