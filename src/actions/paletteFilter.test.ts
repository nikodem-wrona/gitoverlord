import { describe, expect, it } from "vitest";

import { defineAction } from "./defineAction";
import { filterActions } from "./paletteFilter";
import type { ActionSpec } from "./types";

function action(id: string, label: string, extra: Partial<ActionSpec> = {}) {
  return defineAction({
    id,
    label,
    group: "Branches",
    run: () => {},
    ...extra,
  });
}

const ACTIONS = [
  action("view", "Show History", { group: "View" }),
  action("switch-main", "Switch to main"),
  action("switch-topic", "Switch to topic"),
  action("blocked", "Switch to nowhere", { blocked: "Not now." }),
  action("stage", "Stage all changes", { group: "Changes" }),
];

const ids = (found: { id: string }[]) => found.map(({ id }) => id);

describe("filterActions", () => {
  it("lists each action that can run, in the order of the groups", () => {
    expect(ids(filterActions(ACTIONS, ""))).toEqual([
      "stage",
      "switch-main",
      "switch-topic",
      "view",
    ]);
  });

  it("keeps the actions that contain each word, in the group or the label", () => {
    expect(ids(filterActions(ACTIONS, "switch MAIN"))).toEqual(["switch-main"]);
    expect(ids(filterActions(ACTIONS, "branches topic"))).toEqual([
      "switch-topic",
    ]);
  });
});
