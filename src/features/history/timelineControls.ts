import { type KeyboardEvent, useCallback, useState } from "react";

import { type MenuPoint, nextKey } from "@/hud";

import type { TimelineLayout } from "./timelineModel";

/** The commit menu that is open, and its place on the screen. */
export interface OpenMenu {
  hash: string;
  at: MenuPoint;
}

interface ControlOptions {
  /** The loaded history. The newest commit is first. */
  commits: readonly { hash: string }[];
  selectedHash?: string;
  onSelect(hash: string): void;
  layout: TimelineLayout;
}

/**
 * The keys and the commit menu of the timeline.
 *
 * The arrow keys select an older or a newer commit. A right-click, the context
 * menu key, or Shift+F10 opens the commands of a commit.
 */
export function useTimelineControls(options: ControlOptions) {
  const { commits, selectedHash, onSelect, layout } = options;
  const [menu, setMenu] = useState<OpenMenu | null>(null);
  const closeMenu = useCallback(() => setMenu(null), []);
  const openMenu = (hash: string, at: MenuPoint) => {
    onSelect(hash);
    setMenu({ hash, at });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (isMenuKey(event)) {
      const node = layout.nodes.find(({ hash }) => hash === selectedHash);
      if (!node) return;
      event.preventDefault();
      const box = event.currentTarget.getBoundingClientRect();
      setMenu({
        hash: node.hash,
        at: { x: box.left + node.x, y: box.top + node.y },
      });
      return;
    }
    // The oldest commit is at the left, so the right arrow goes to a newer commit.
    const leftToRight = commits.map(({ hash }) => hash).reverse();
    const next = nextKey(leftToRight, selectedHash, event.key, "horizontal");
    if (next === undefined) return;
    event.preventDefault();
    if (next !== selectedHash) onSelect(next);
  };

  return { menu, openMenu, closeMenu, onKeyDown };
}

function isMenuKey(event: KeyboardEvent): boolean {
  return event.key === "ContextMenu" || (event.shiftKey && event.key === "F10");
}
