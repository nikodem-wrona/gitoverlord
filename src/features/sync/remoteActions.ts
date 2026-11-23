import { type Action, defineAction } from "@/actions";
import type { RepoWriter } from "@/features/repository";
import { commands, unwrap } from "@/ipc";

const URL_PLACEHOLDER = "https://github.com/owner/repository.git";

/** Asks for a URL and adds it as the remote `origin`. A publish then goes there. */
export function addOriginAction(
  repo: RepoWriter,
  remotes: readonly string[],
): Action {
  return defineAction({
    id: "sync.addOrigin",
    label: "Add the remote origin…",
    group: "Sync",
    blocked: remotes.includes("origin")
      ? "The repository has a remote named origin."
      : undefined,
    prompt: {
      title: "Add the remote origin",
      label: "URL of the remote repository",
      placeholder: URL_PLACEHOLDER,
      submit: "Add",
    },
    run: async (url) => {
      await repo.write(commands.addRemote(repo.path, "origin", url));
      return { title: "Remote added", message: `origin is ${url}.` };
    },
  });
}

/** Asks for a URL and a folder, clones the repository there, and opens it. */
export function cloneAction(open: (path: string) => void): Action {
  return defineAction({
    id: "repository.clone",
    label: "Clone a repository…",
    group: "Repository",
    shortcut: "Mod+Shift+O",
    prompt: {
      title: "Clone a repository",
      label: "URL of the repository",
      placeholder: URL_PLACEHOLDER,
      submit: "Clone",
    },
    run: async (url) => {
      const parent = await unwrap(
        commands.pickFolder("Select the folder for the clone"),
      );
      if (parent === null) return;
      const path = await unwrap(commands.cloneRepository(url, parent));
      open(path);
      return { title: "Repository cloned", message: path };
    },
  });
}
