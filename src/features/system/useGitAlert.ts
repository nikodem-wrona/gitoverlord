import { useEffect, useRef } from "react";

import { useToast } from "@/hud";

import { useGitStatus } from "./useGitStatus";

/** Shows a notification once if the system `git` cannot be used. */
export function useGitAlert(): void {
  const { state, value, hint } = useGitStatus();
  const toast = useToast();
  const shown = useRef(false);

  useEffect(() => {
    if (state !== "fail" || shown.current) return;
    shown.current = true;
    toast.fail(`Git: ${value}`, hint);
  }, [state, value, hint, toast]);
}
