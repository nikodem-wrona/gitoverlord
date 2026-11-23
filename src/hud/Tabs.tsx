import type { KeyboardEvent, ReactNode } from "react";

import { nextKey } from "./keys";
import { PulseDot } from "./motion/PulseDot";
import { tabId, tabPanelId } from "./tabIds";
import styles from "./Tabs.module.css";

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  /** The accessible name of the tab list. */
  label: string;
  /** Makes the element IDs unique. Give the same value to `TabPanel`. */
  idPrefix: string;
  tabs: readonly TabItem[];
  activeId: string;
  onChange(id: string): void;
}

/** A strip of module tabs. The arrow keys move between tabs. */
export function Tabs({ label, idPrefix, tabs, activeId, onChange }: TabsProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const ids = tabs.map((tab) => tab.id);
    const next = nextKey(ids, activeId, event.key, "horizontal");
    if (next === undefined) return;
    event.preventDefault();
    onChange(next);
    document.getElementById(tabId(idPrefix, next))?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={styles.tabs}
      onKeyDown={onKeyDown}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={tabId(idPrefix, tab.id)}
          aria-selected={tab.id === activeId}
          aria-controls={tabPanelId(idPrefix)}
          tabIndex={tab.id === activeId ? 0 : -1}
          className={styles.tab}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          <PulseDot
            tone={tab.id === activeId ? "ok" : "dim"}
            pulse={tab.id === activeId}
          />
        </button>
      ))}
    </div>
  );
}

interface TabPanelProps {
  idPrefix: string;
  activeId: string;
  className?: string;
  children: ReactNode;
}

/** The content area that a `Tabs` strip controls. */
export function TabPanel({
  idPrefix,
  activeId,
  className,
  children,
}: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={tabPanelId(idPrefix)}
      aria-labelledby={tabId(idPrefix, activeId)}
      className={className}
    >
      {children}
    </div>
  );
}
