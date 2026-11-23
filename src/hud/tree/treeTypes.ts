export type TreeIconKind =
  "repository" | "folder" | "branch" | "remote" | "tag";

export interface TreeNode {
  id: string;
  label: string;
  icon: TreeIconKind;
  /** Short text at the right side of the row, for example a count. */
  meta?: string;
  children?: readonly TreeNode[];
}

/** Returns a copy of `expanded` with `id` added or removed. */
export function toggled(
  expanded: ReadonlySet<string>,
  id: string,
): Set<string> {
  const next = new Set(expanded);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
