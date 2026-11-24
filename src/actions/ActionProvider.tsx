import { type ReactNode, useCallback, useMemo, useState } from "react";

import { ActionContext, type ActionsApi } from "./actionContext";
import { ActionDialog } from "./ActionDialog";
import { CommandPalette } from "./CommandPalette";
import { createActionRegistry } from "./registry";
import type { Action } from "./types";
import { useActionRunner } from "./useActionRunner";
import { useShortcuts } from "./useShortcuts";

/** Runs the actions, and holds the command palette, the shortcuts, and the questions. */
export function ActionProvider({ children }: { children: ReactNode }) {
  const [registry] = useState(createActionRegistry);
  const runner = useActionRunner();
  const [palette, setPalette] = useState(false);
  const openPalette = useCallback(() => setPalette(true), []);
  const closePalette = () => setPalette(false);
  const runFromPalette = (action: Action) => {
    closePalette();
    runner.run(action);
  };
  useShortcuts(registry, runner.run, {
    paused: palette || runner.asking !== null,
    openPalette,
  });

  const { run, busy, last } = runner;
  const api = useMemo<ActionsApi>(
    () => ({ run, busy, last, registry, openPalette }),
    [run, busy, last, registry, openPalette],
  );

  return (
    <ActionContext value={api}>
      {children}
      {palette && (
        <CommandPalette
          actions={registry.list()}
          onRun={runFromPalette}
          onClose={closePalette}
        />
      )}
      {runner.asking && (
        <ActionDialog
          action={runner.asking}
          onAnswer={runner.answer}
          onCancel={runner.cancel}
        />
      )}
    </ActionContext>
  );
}
