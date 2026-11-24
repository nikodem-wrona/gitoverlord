import { useCallback, useRef, useState } from "react";

import { type ToastAction, type ToastApi, useToast } from "@/hud";
import { errorMessage } from "@/ipc";

import type { LastOutcome } from "./actionContext";
import type { Action, Outcome } from "./types";

/** A fast action shows no progress notification. */
const PROGRESS_DELAY = 400;

/** Runs actions one at a time, with their question, progress, and result. */
export function useActionRunner() {
  const toast = useToast();
  const [asking, setAsking] = useState<Action | null>(null);
  const [busy, setBusy] = useState<Action | null>(null);
  const [last, setLast] = useState<LastOutcome | null>(null);
  // The state changes after the next render. This ref stops a second run before it.
  const running = useRef(false);

  const execute = useCallback(
    async (action: Action, text: string) => {
      running.current = true;
      setBusy(action);
      const stopProgress = showProgress(toast, action);
      const report = (title: string, tone: LastOutcome["tone"]) =>
        setLast((old) => ({ id: (old?.id ?? 0) + 1, title, tone }));
      try {
        const outcome = await action.run(text);
        if (outcome) {
          showOutcome(toast, outcome);
          report(outcome.title, outcome.tone ?? "ok");
        }
      } catch (error) {
        toast.fail(`${action.label} failed`, errorMessage(error));
        report(`${action.label} failed`, "fail");
      } finally {
        stopProgress();
        running.current = false;
        setBusy(null);
      }
    },
    [toast],
  );

  const run = useCallback(
    (action: Action) => {
      if (running.current) return;
      if (action.blocked) {
        toast.info(action.label, action.blocked);
      } else if (action.prompt || action.confirm) {
        setAsking(action);
      } else {
        void execute(action, "");
      }
    },
    [execute, toast],
  );

  const answer = (text: string) => {
    setAsking(null);
    if (asking) void execute(asking, text);
  };
  const cancel = () => setAsking(null);

  return { run, busy, last, asking, answer, cancel };
}

/** Shows a notification if the action takes some time. Returns a function that removes it. */
function showProgress(toast: ToastApi, action: Action): () => void {
  let id: number | undefined;
  const timer = setTimeout(() => {
    id = toast.info("Working", action.label, { sticky: true });
  }, PROGRESS_DELAY);
  return () => {
    clearTimeout(timer);
    if (id !== undefined) toast.dismiss(id);
  };
}

function showOutcome(toast: ToastApi, outcome: Outcome): void {
  const show = toast[outcome.tone ?? "ok"];
  show(outcome.title, outcome.message, { action: undoOf(toast, outcome) });
}

function undoOf(toast: ToastApi, outcome: Outcome): ToastAction | undefined {
  const { undo } = outcome;
  if (!undo) return undefined;
  return {
    label: "Undo",
    run: () => {
      undo().then(
        () => toast.ok("Undone", outcome.title),
        (error: unknown) => toast.fail("Undo failed", errorMessage(error)),
      );
    },
  };
}
