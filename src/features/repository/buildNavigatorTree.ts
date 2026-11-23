import type { TreeNode } from "@/hud";

import type { Repository } from "./types";

/** Makes the navigator tree: the repository with its branches, remotes, and tags. */
export function buildNavigatorTree(repository: Repository): TreeNode[] {
  const branches = repository.branches.map((branch) => ({
    id: `branch:${branch.name}`,
    label: branch.name,
    icon: "branch" as const,
    meta: branch.current ? "HEAD" : undefined,
  }));
  const remotes = repository.remotes.map((name) => leaf("remote", name));
  const tags = repository.tags.map((name) => leaf("tag", name));

  return [
    {
      id: "repository",
      label: repository.name,
      icon: "repository",
      children: [
        group("branches", "Branches", branches),
        group("remotes", "Remotes", remotes),
        group("tags", "Tags", tags),
      ],
    },
  ];
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
