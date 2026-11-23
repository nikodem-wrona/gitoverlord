export type ModuleId =
  "changes" | "history" | "branches" | "remotes" | "stash" | "pullRequests";

export interface ModuleInfo {
  id: ModuleId;
  /** The text on the tab. */
  label: string;
  /** The title of the workspace panel. */
  title: string;
  /** The roadmap phase that makes the module work. Only for modules that are not ready. */
  phase?: number;
}

/** The modules in the order of the tab strip. */
export const MODULES: Record<ModuleId, ModuleInfo> = {
  changes: { id: "changes", label: "Changes", title: "Working tree" },
  history: { id: "history", label: "History", title: "Commit log" },
  branches: { id: "branches", label: "Branches", title: "Branch registry" },
  remotes: { id: "remotes", label: "Remotes", title: "Remote links", phase: 4 },
  stash: { id: "stash", label: "Stash", title: "Stash vault" },
  pullRequests: {
    id: "pullRequests",
    label: "Pull requests",
    title: "Pull requests",
    phase: 5,
  },
};

export const MODULE_LIST: readonly ModuleInfo[] = Object.values(MODULES);

/** Makes the element IDs of the module tabs unique. */
export const MODULE_TABS_ID = "module";

export function isModuleId(id: string): id is ModuleId {
  return Object.hasOwn(MODULES, id);
}
