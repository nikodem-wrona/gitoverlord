import { type KeyboardEvent, useMemo, useState } from "react";

import { Dialog, TextField } from "@/hud";

import styles from "./CommandPalette.module.css";
import { filterActions } from "./paletteFilter";
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
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const found = useMemo(() => filterActions(actions, query), [actions, query]);
  const onKeyDown = (event: KeyboardEvent) => {
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (step !== undefined) {
      event.preventDefault();
      setActive((index) => clamp(index + step, found.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const action = found[active];
      if (action) onRun(action);
    }
  };

  return (
    <Dialog title="Command palette" onClose={onClose}>
      <TextField
        label="Search the commands"
        hideLabel
        value={query}
        onChange={(text) => {
          setQuery(text);
          setActive(0);
        }}
        placeholder="Type a command"
        onKeyDown={onKeyDown}
      />
      {found.length === 0 ? (
        <p className={styles.empty}>No command has this name.</p>
      ) : (
        <CommandList actions={found} active={active} onRun={onRun} />
      )}
    </Dialog>
  );
}

interface CommandListProps {
  actions: readonly Action[];
  active: number;
  onRun(action: Action): void;
}

function CommandList({ actions, active, onRun }: CommandListProps) {
  const mac = isMac();
  return (
    <ul role="listbox" aria-label="Commands" className={styles.list}>
      {actions.map((action, index) => (
        <li
          key={action.id}
          role="option"
          aria-selected={index === active}
          className={styles.option}
          onClick={() => onRun(action)}
          ref={index === active ? scrollIntoView : undefined}
        >
          <span className={styles.group}>{action.group}</span>
          <span className={styles.label}>{action.label}</span>
          {action.shortcut && (
            <kbd className={styles.keys}>
              {formatShortcut(action.shortcut, mac)}
            </kbd>
          )}
        </li>
      ))}
    </ul>
  );
}

function clamp(index: number, count: number): number {
  return Math.max(0, Math.min(index, count - 1));
}

function scrollIntoView(element: HTMLElement | null): void {
  element?.scrollIntoView?.({ block: "nearest" });
}
