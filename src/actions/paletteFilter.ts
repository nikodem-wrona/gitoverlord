import { ACTION_GROUPS, type Action } from "./types";

/**
 * Finds the actions that contain each word of `query` in their group or label.
 *
 * Blocked actions are not in the result. The result is in the order of the groups.
 */
export function filterActions(
  actions: readonly Action[],
  query: string,
): Action[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const found = actions.filter((action) => {
    const text = `${action.group} ${action.label}`.toLowerCase();
    return !action.blocked && words.every((word) => text.includes(word));
  });
  return found.sort(
    (a, b) => ACTION_GROUPS.indexOf(a.group) - ACTION_GROUPS.indexOf(b.group),
  );
}
