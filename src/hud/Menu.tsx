import {
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { nextKey } from "./keys";
import styles from "./Menu.module.css";

export interface MenuItem {
  id: string;
  label: string;
  /** The reason why the item cannot run now. The item is then disabled. */
  blocked?: string;
  /** Marks an item that removes or replaces data. */
  danger?: boolean;
  /** Makes the item a choice of a set. `true` marks the chosen item. */
  checked?: boolean;
}

/** A position in pixels from the top-left corner of the window. */
export interface MenuPoint {
  x: number;
  y: number;
}

interface MenuProps {
  /** The accessible name of the menu. */
  label: string;
  items: readonly MenuItem[];
  /** The top-left corner of the menu. The menu moves to stay in the window. */
  at: MenuPoint;
  /** Opens the menu above `at`: `at` is then its bottom-left corner. */
  above?: boolean;
  onSelect(id: string): void;
  onClose(): void;
}

/** The distance between the menu and the edge of the window. */
const EDGE = 8;

/**
 * A pop-up list of commands, for example a context menu.
 *
 * The arrow keys move the focus, and Enter selects an item. Escape, Tab, or a
 * click outside closes the menu. Then the focus goes back to where it was.
 */
export function Menu(props: MenuProps) {
  const { label, items, at, above = false, onSelect, onClose } = props;
  const ref = useRef<HTMLDivElement>(null);
  const position = useFitInWindow(ref, at, above);
  useCloseOutside(ref, onClose);
  useFocusFirst(ref);

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      className={styles.menu}
      style={{ left: position.x, top: position.y }}
      onKeyDown={(event) => onMenuKey(event, items, onClose)}
      onContextMenu={(event) => event.preventDefault()}
    >
      {items.map((item) => (
        <MenuEntry key={item.id} item={item} onSelect={onSelect} />
      ))}
    </div>,
    document.body,
  );
}

function MenuEntry(props: { item: MenuItem; onSelect(id: string): void }) {
  const { item, onSelect } = props;
  const choice = item.checked !== undefined;
  return (
    <button
      type="button"
      role={choice ? "menuitemradio" : "menuitem"}
      aria-checked={choice ? item.checked : undefined}
      tabIndex={-1}
      data-id={item.id}
      className={styles.item}
      data-danger={item.danger || undefined}
      aria-disabled={item.blocked ? true : undefined}
      title={item.blocked}
      onClick={() => {
        if (!item.blocked) onSelect(item.id);
      }}
    >
      {item.label}
    </button>
  );
}

/** Moves the focus with the arrow keys, Home, and End. Escape and Tab close the menu. */
function onMenuKey(
  event: KeyboardEvent<HTMLDivElement>,
  items: readonly MenuItem[],
  onClose: () => void,
): void {
  if (event.key === "Escape" || event.key === "Tab") {
    event.preventDefault();
    event.stopPropagation();
    onClose();
    return;
  }
  const ids = items.map((item) => item.id);
  const focused = document.activeElement?.getAttribute("data-id");
  const next = nextKey(ids, focused ?? undefined, event.key, "vertical");
  if (next === undefined) return;
  event.preventDefault();
  const buttons =
    event.currentTarget.querySelectorAll<HTMLElement>("[data-id]");
  buttons[ids.indexOf(next)]?.focus();
}

/** Moves the menu left or up when it would go past the edge of the window. */
function useFitInWindow(
  ref: RefObject<HTMLDivElement | null>,
  at: MenuPoint,
  above: boolean,
): MenuPoint {
  const [position, setPosition] = useState(at);
  useLayoutEffect(() => {
    const size = ref.current?.getBoundingClientRect();
    const width = size?.width ?? 0;
    const height = size?.height ?? 0;
    const top = above ? at.y - height : at.y;
    setPosition({
      x: Math.max(EDGE, Math.min(at.x, window.innerWidth - width - EDGE)),
      y: Math.max(EDGE, Math.min(top, window.innerHeight - height - EDGE)),
    });
  }, [ref, at, above]);
  return position;
}

/** Closes the menu on a mouse press outside it, and when the window loses the focus. */
function useCloseOutside(
  ref: RefObject<HTMLDivElement | null>,
  onClose: () => void,
): void {
  useEffect(() => {
    const onPress = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onPress);
    window.addEventListener("blur", onClose);
    return () => {
      document.removeEventListener("mousedown", onPress);
      window.removeEventListener("blur", onClose);
    };
  }, [ref, onClose]);
}

/** Gives the first item the focus. When the menu closes, the focus goes back. */
function useFocusFirst(ref: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    const before = document.activeElement;
    const menu = ref.current;
    const first =
      menu?.querySelector<HTMLElement>("[aria-checked='true']") ??
      menu?.querySelector<HTMLElement>("[data-id]");
    first?.focus();
    return () => {
      if (before instanceof HTMLElement) before.focus();
    };
  }, [ref]);
}
