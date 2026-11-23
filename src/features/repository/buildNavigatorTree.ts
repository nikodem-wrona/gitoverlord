import type { TreeNode } from "@/hud";
import type { Branch, RepoSummary } from "@/ipc";

/** Makes the navigator tree: the repository with its branches, remotes, and tags. */
export function buildNavigatorTree(
  summary: RepoSummary,
  branches: readonly Branch[],
): TreeNode[] {
  const branchNodes = branches.map((branch) => ({
    id: branchNodeId(branch.name),
    label: branch.name,
    icon: "branch" as const,
    meta: branch.current ? "HEAD" : undefined,
  }));
  const remotes = summary.remotes.map((name) => leaf("remote", name));
  const tags = summary.tags.map((name) => leaf("tag", name));

  return [
    {
      id: "repository",
      label: summary.name,
      icon: "repository",
      children: [
        group("branches", "Branches", branchNodes),
        group("remotes", "Remotes", remotes),
        group("tags", "Tags", tags),
      ],
    },
  ];
}

export function branchNodeId(name: string): string {
  return `branch:${name}`;
}

function leaf(icon: "remote" | "tag", name: string): TreeNode {
  return { id: `${icon}:${name}`, label: name, icon };
}

function group(
  id: string,
  label: string,
  children: readonly TreeNode[],
): TreeNode {
  return { id, label, icon: "folder", meta: String(children.length), children };
}
