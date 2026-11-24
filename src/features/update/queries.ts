import { useQuery } from "@tanstack/react-query";

import { commands, unwrap } from "@/ipc";

/** The version of this build. Keep `package.json` and `Cargo.toml` at the same version. */
export const APP_VERSION = import.meta.env.APP_VERSION;

/** A release comes at most a few times a week. A check each six hours is enough. */
const CHECK_INTERVAL = 6 * 60 * 60 * 1000;

export const updateKeys = { check: ["update"] } as const;

/** The newer version on the release server. `null` when this version is the newest. */
export function useAppUpdate() {
  return useQuery({
    queryKey: updateKeys.check,
    queryFn: () => unwrap(commands.checkForUpdate()),
    staleTime: CHECK_INTERVAL,
    refetchInterval: CHECK_INTERVAL,
  });
}
