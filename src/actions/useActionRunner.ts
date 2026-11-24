import { useCallback, useRef, useState } from "react";

import { type ToastAction, type ToastApi, useSound, useToast } from "@/hud";
import { errorMessage } from "@/ipc";

import type { LastOutcome } from "./actionContext";
import type { Action, Outcome } from "./types";

/** A fast action shows no progress notification. */
const PROGRESS_DELAY = 400;

/** Runs actions one at a time, with their question, progress, and result. */
export function useActionRunner() {
  const toast = useToast();
  const results = useResults();
  const [asking, setAsking] = useState<Action | null>(null);
  const [busy, setBusy] = useState<Action | null>(null);
  // The state changes after the next render. This ref stops a second run before it.
  const running = useRef(false);
  const { succeed, fail } = results;

  const execute = useCallback(
    async (action: Action, text: string) => {
      running.current = true;
      setBusy(action);
      const stopProgress = showProgress(toast, action);
      try {
        const outcome = await action.run(text);
        if (!outcome) return undefined;
        succeed(outcome);
        return outcome.next;
      } catch (error) {
        fail(action, error);
        return undefined;
      } finally {
        stopProgress();
        running.current = false;
        setBusy(null);
      }
    },
    [toast, succeed, fail],
  );

  const run = useCallback(
    function start(action: Action) {
      if (running.current) return;
      if (action.blocked) {
        toast.info(action.label, action.blocked);
      } else if (action.prompt || action.confirm) {
        setAsking(action);
      } else {
        void execute(action, "").then(follow(start));
      }
    },
    [execute, toast],
  );

  const answer = (text: string) => {
    setAsking(null);
    if (asking) void execute(asking, text).then(follow(run));
  };
  const cancel = () => setAsking(null);

  return { run, busy, last: results.last, asking, answer, cancel };
}

/** Starts the action that follows a result, if the result has one. */
function follow(start: (action: Action) => void) {
  return (next: Action | undefined) => {
    if (next) start(next);
  };
}

/** Shows the result of an action: the notification, the status bar, and the sound. */
function useResults() {
  const toast = useToast();
  const sound = useSound();
  const [last, setLast] = useState<LastOutcome | null>(null);
  const report = useCallback(
    (title: string, tone: LastOutcome["tone"]) => {
      setLast((old) => ({ id: (old?.id ?? 0) + 1, title, tone }));
      sound.play(tone);
    },
    [sound],
  );
  const succeed = useCallback(
    (outcome: Outcome) => {
      showOutcome(toast, outcome);
      report(outcome.title, outcome.tone ?? "ok");
    },
    [toast, report],
  );
  const fail = useCallback(
    (action: Action, error: unknown) => {
      toast.fail(`${action.label} failed`, errorMessage(error));
      report(`${action.label} failed`, "fail");
    },
    [toast, report],
  );
  return { last, succeed, fail };
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
