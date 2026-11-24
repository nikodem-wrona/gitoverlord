import type { AppUpdate, MockCommandHandlers } from "@/ipc";

type UpdateHandlers = Pick<
  MockCommandHandlers,
  "checkForUpdate" | "installUpdate"
>;

/** The demo offers one update, so that the status bar shows the update button. */
export function updateHandlers(): UpdateHandlers {
  let installed = false;
  return {
    checkForUpdate: () => (installed ? null : demoUpdate()),
    installUpdate: () => {
      installed = true;
      return null;
    },
  };
}

/** The next minor version after the version of this build. */
function demoUpdate(): AppUpdate {
  const current = import.meta.env.APP_VERSION;
  const [major = 0, minor = 0] = current.split(".").map(Number);
  return { version: `${major}.${minor + 1}.0`, currentVersion: current };
}
