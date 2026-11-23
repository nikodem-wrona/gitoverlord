import { useCallback, useState } from "react";

import { BootScreen } from "@/features/boot";
import { useGitAlert } from "@/features/system";
import { useMotion } from "@/hud";

import { AppShell } from "./AppShell";

/** Shows the boot sequence, then the shell. Calm mode goes directly to the shell. */
export function Root() {
  const { calm } = useMotion();
  const [booted, setBooted] = useState(calm);
  const finishBoot = useCallback(() => setBooted(true), []);
  useGitAlert();

  return booted ? <AppShell /> : <BootScreen onFinish={finishBoot} />;
}
