import { type KeyboardEvent, type ReactNode, useMemo, useState } from "react";

import { TextField } from "@/hud";

import styles from "./CommandPalette.module.css";

interface PickListProps<T> {
  /** The name of the search field for a screen reader. */
  label: string;
  placeholder: string;
  /** The name of the list for a screen reader. */
  listLabel: string;
  /** The text when no item agrees with the search. */
  empty: string;
  /** The items that agree with the search text. */
  filter(query: string): readonly T[];
  keyOf(item: T): string;
  render(item: T): ReactNode;
  onPick(item: T): void;
}

/** A search field over a list. The arrow keys select, and the Enter key picks. */
export function PickList<T>(props: PickListProps<T>) {
  const { filter, onPick } = props;
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const found = useMemo(() => filter(query), [filter, query]);
  const onKeyDown = (event: KeyboardEvent) => {
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (step !== undefined) {
      event.preventDefault();
      setActive((index) => clamp(index + step, found.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = found[active];
      if (item !== undefined) onPick(item);
    }
  };

  return (
    <>
      <TextField
        label={props.label}
        hideLabel
        value={query}
        onChange={(text) => {
          setQuery(text);
          setActive(0);
        }}
        placeholder={props.placeholder}
        onKeyDown={onKeyDown}
      />
      {found.length === 0 ? (
        <p className={styles.empty}>{props.empty}</p>
      ) : (
        <ul role="listbox" aria-label={props.listLabel} className={styles.list}>
          {found.map((item, index) => (
            <li
              key={props.keyOf(item)}
              role="option"
              aria-selected={index === active}
              className={styles.option}
              onClick={() => onPick(item)}
              ref={index === active ? scrollIntoView : undefined}
            >
              {props.render(item)}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function clamp(index: number, count: number): number {
  return Math.max(0, Math.min(index, count - 1));
}

function scrollIntoView(element: HTMLElement | null): void {
  element?.scrollIntoView?.({ block: "nearest" });
}
