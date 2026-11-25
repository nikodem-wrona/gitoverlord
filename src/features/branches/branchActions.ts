import { type Action, defineAction } from "@/actions";
import { type RepoWriter, shortHash } from "@/features/repository";
import { type Branch, commands } from "@/ipc";

const NO_BRANCH = "Select a branch.";

/** Asks for a name, then creates a branch at `HEAD` and switches to it. */
export function newBranchAction(repo: RepoWriter): Action {
  return defineAction({
    id: "branches.create",
    label: "New branch…",
    group: "Branches",
    shortcut: "Mod+Shift+N",
    prompt: {
      title: "New branch",
      label: "Branch name",
      placeholder: "feature/new-idea",
      submit: "Create and switch",
    },
    run: async (name) => {
      await repo.write(commands.createBranch(repo.path, name, null));
      return {
        title: "Branch created",
        message: `${name} is the current branch.`,
      };
    },
  });
}

export function switchBranchAction(repo: RepoWriter, branch?: Branch): Action {
  const name = branch?.name ?? "";
  return defineAction({
    id: `branches.switch:${name}`,
    label: `Switch to ${name || "a branch"}`,
    group: "Branches",
    blocked: !branch
      ? NO_BRANCH
      : branch.current
        ? "This is the current branch."
        : undefined,
    run: () => switchTo(repo, name),
  });
}

/** Asks for one of the other branches, then switches to it. */
export function pickBranchAction(
  repo: RepoWriter,
  branches: readonly Branch[] = [],
): Action {
  const others = branches.filter((branch) => !branch.current);
  return defineAction({
    id: "branches.switch",
    label: "Switch branch…",
    group: "Branches",
    shortcut: "Mod+Shift+B",
    blocked: others.length === 0 ? "There is no other branch." : undefined,
    choose: {
      title: "Switch branch",
      label: "Search the branches",
      placeholder: "Type a branch name",
      options: others.map((branch) => branch.name),
      empty: "No branch has this name.",
    },
    run: (name) => switchTo(repo, name),
  });
}

async function switchTo(repo: RepoWriter, name: string) {
  await repo.write(commands.switchBranch(repo.path, name));
  return {
    title: "Branch switched",
    message: `${name} is the current branch.`,
  };
}

export function renameBranchAction(repo: RepoWriter, branch?: Branch): Action {
  const name = branch?.name ?? "";
  return defineAction({
    id: `branches.rename:${name}`,
    label: `Rename ${name || "a branch"}…`,
    group: "Branches",
    blocked: branch ? undefined : NO_BRANCH,
    prompt: {
      title: "Rename branch",
      label: "New name",
      initial: name,
      submit: "Rename",
    },
    run: async (newName) => {
      if (newName === name) return;
      await repo.write(commands.renameBranch(repo.path, name, newName));
      return { title: "Branch renamed", message: `${name} → ${newName}` };
    },
  });
}

/** Deletes a branch, also if it is not merged. The undo makes it again at the same commit. */
export function deleteBranchAction(repo: RepoWriter, branch?: Branch): Action {
  const name = branch?.name ?? "";
  return defineAction({
    id: `branches.delete:${name}`,
    label: `Delete ${name || "a branch"}…`,
    group: "Branches",
    blocked: !branch
      ? NO_BRANCH
      : branch.current
        ? "Switch to another branch first."
        : undefined,
    confirm: {
      title: "Delete branch",
      message: `The branch ${name} goes, also if other branches do not have its commits. You can undo this.`,
      confirm: "Delete",
    },
    run: async () => {
      const tip = await repo.write(commands.deleteBranch(repo.path, name));
      const undo = () =>
        repo.write(commands.restoreBranch(repo.path, name, tip));
      return {
        title: "Branch deleted",
        message: `${name} was at ${shortHash(tip)}.`,
        undo,
      };
    },
  });
}

/** The branch actions for the command palette. */
export function branchActions(
  repo: RepoWriter,
  branches: readonly Branch[] = [],
): Action[] {
  const current = branches.find((branch) => branch.current);
  return [
    newBranchAction(repo),
    ...(current ? [renameBranchAction(repo, current)] : []),
    pickBranchAction(repo, branches),
  ];
}
