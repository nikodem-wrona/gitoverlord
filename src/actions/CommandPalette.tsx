import { useCallback } from "react";

import { Dialog } from "@/hud";

import styles from "./CommandPalette.module.css";
import { filterActions } from "./paletteFilter";
import { PickList } from "./PickList";
import { formatShortcut, isMac } from "./shortcuts";
import type { Action } from "./types";

interface CommandPaletteProps {
  actions: readonly Action[];
  onRun(action: Action): void;
  onClose(): void;
}

/** Finds a command by its name. The arrow keys select, and the Enter key runs. */
export function CommandPalette({
  actions,
  onRun,
  onClose,
}: CommandPaletteProps) {
  const filter = useCallback(
    (query: string) => filterActions(actions, query),
    [actions],
  );
  const mac = isMac();
  return (
    <Dialog title="Command palette" onClose={onClose}>
      <PickList
        label="Search the commands"
        placeholder="Type a command"
        listLabel="Commands"
        empty="No command has this name."
        filter={filter}
        keyOf={(action) => action.id}
        onPick={onRun}
        render={(action) => (
          <>
            <span className={styles.group}>{action.group}</span>
            <span className={styles.label}>{action.label}</span>
            {action.shortcut && (
              <kbd className={styles.keys}>
                {formatShortcut(action.shortcut, mac)}
              </kbd>
            )}
          </>
        )}
      />
    </Dialog>
  );
}
