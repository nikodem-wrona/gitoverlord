import { Button, type ButtonVariant } from "@/hud";

import { useActions } from "./actionContext";
import { formatShortcut, isMac } from "./shortcuts";
import type { Action } from "./types";

interface ActionButtonProps {
  action: Action;
  variant?: ButtonVariant;
  compact?: boolean;
  /** Shorter text for the button. The label of the action stays its accessible name. */
  text?: string;
}

/** A button that runs an action. It shows the shortcut on hover, or why it cannot run. */
export function ActionButton({
  action,
  variant,
  compact,
  text,
}: ActionButtonProps) {
  const { run, busy } = useActions();
  const hint = action.shortcut
    ? `${action.label} (${formatShortcut(action.shortcut, isMac())})`
    : undefined;

  return (
    <Button
      variant={variant}
      compact={compact}
      disabled={Boolean(action.blocked)}
      busy={busy?.id === action.id}
      title={action.blocked ?? hint}
      aria-label={text === undefined ? undefined : action.label}
      onClick={(event) => {
        // A button in a table row must not also select the row.
        event.stopPropagation();
        run(action);
      }}
    >
      {text ?? action.label}
    </Button>
  );
}
