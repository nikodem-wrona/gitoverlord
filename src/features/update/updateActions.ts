import { type QueryClient, useQueryClient } from "@tanstack/react-query";

import { type Action, defineAction, useRegisterActions } from "@/actions";
import { type AppUpdate, commands, unwrap } from "@/ipc";

import { APP_VERSION, updateKeys, useAppUpdate } from "./queries";

/** Puts the update actions in the command palette. */
export function useUpdateActions(): void {
  const client = useQueryClient();
  const update = useAppUpdate().data;
  useRegisterActions([
    checkUpdateAction(client),
    ...(update ? [installUpdateAction(client, update)] : []),
  ]);
}

/** Asks the release server for a newer version now. If there is one, the install question follows. */
export function checkUpdateAction(client: QueryClient): Action {
  return defineAction({
    id: "application.checkUpdate",
    label: "Check for updates",
    group: "Application",
    run: async () => {
      const update = await unwrap(commands.checkForUpdate());
      client.setQueryData(updateKeys.check, update);
      if (!update) {
        return { title: "gitoverlord is up to date", message: APP_VERSION };
      }
      return {
        title: `gitoverlord ${update.version} is available`,
        message: "To install it later, select the update in the status bar.",
        next: installUpdateAction(client, update),
      };
    },
  });
}

/** Downloads and installs the update. A release build then starts again. */
export function installUpdateAction(
  client: QueryClient,
  update: AppUpdate,
): Action {
  return defineAction({
    id: "application.installUpdate",
    // The label starts with "Update", so that the word finds it in the command palette.
    label: `Update gitoverlord to ${update.version}…`,
    group: "Application",
    confirm: {
      title: `Install gitoverlord ${update.version}`,
      message: `gitoverlord downloads version ${update.version}, installs it, and starts again. Your repositories and your changes stay as they are.`,
      confirm: "Install and restart",
    },
    run: async () => {
      await unwrap(commands.installUpdate());
      // A release build starts again before this line. The demo backend does not.
      await client.invalidateQueries({ queryKey: updateKeys.check });
      return {
        title: `Installed gitoverlord ${update.version}`,
        message: "Restart gitoverlord to use the new version.",
      };
    },
  });
}
