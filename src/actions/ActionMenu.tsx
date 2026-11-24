import { type MouseEvent, useCallback, useState } from "react";

import { Button, type ButtonVariant, Menu, type MenuPoint } from "@/hud";

import { useActions } from "./actionContext";
import type { Action } from "./types";

interface ActionMenuProps {
  /** The accessible name of the menu. */
  label: string;
  actions: readonly Action[];
  at: MenuPoint;
  onClose(): void;
}

/** A menu of actions. Each item runs its action like a button: question, progress, and result. */
export function ActionMenu({ label, actions, at, onClose }: ActionMenuProps) {
  const { run } = useActions();
  const items = actions.map((action) => ({
    id: action.id,
    label: action.label,
    blocked: action.blocked,
    danger: Boolean(action.confirm),
  }));
  const select = (id: string) => {
    const action = actions.find((candidate) => candidate.id === id);
    onClose();
    if (action) run(action);
  };

  return (
    <Menu
      label={label}
      items={items}
      at={at}
      onSelect={select}
      onClose={onClose}
    />
  );
}

interface ActionMenuButtonProps {
  /** The accessible name of the menu. */
  label: string;
  /** The text of the button. */
  text: string;
  actions: readonly Action[];
  variant?: ButtonVariant;
  compact?: boolean;
}

/** A button that opens a menu of actions under it. */
export function ActionMenuButton(props: ActionMenuButtonProps) {
  const { label, text, actions, variant, compact } = props;
  const [at, setAt] = useState<MenuPoint | null>(null);
  const close = useCallback(() => setAt(null), []);
  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setAt((open) => (open ? null : { x: box.left, y: box.bottom + 2 }));
  };
  const blocked = actions.every((action) => action.blocked);

  return (
    <>
      <Button
        variant={variant}
        compact={compact}
        aria-haspopup="menu"
        aria-expanded={at !== null}
        disabled={blocked}
        title={blocked ? actions[0]?.blocked : undefined}
        // A press on the button must not count as a press outside the open menu.
        onMouseDown={(event) => event.stopPropagation()}
        onClick={toggle}
      >
        {text} ▾
      </Button>
      {at && (
        <ActionMenu label={label} actions={actions} at={at} onClose={close} />
      )}
    </>
  );
}
