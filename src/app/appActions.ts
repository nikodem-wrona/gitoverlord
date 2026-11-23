import { type Action, defineAction } from "@/actions";
import type { RepoSession } from "@/features/repository";
import { cloneAction } from "@/features/sync";
import type { Motion } from "@/hud";

import { MODULE_LIST, type ModuleId } from "./modules";

interface AppState {
  session: RepoSession;
  motion: Motion;
  showModule(id: ModuleId): void;
}

/** The actions of the application: the modules, the repositories, and calm mode. */
export function appActions({
  session,
  motion,
  showModule,
}: AppState): Action[] {
  return [
    ...moduleActions(showModule),
    ...repositoryActions(session),
    calmAction(motion),
  ];
}

/** One action for each module that works. `Mod+1` shows the first module. */
function moduleActions(showModule: (id: ModuleId) => void): Action[] {
  const ready = MODULE_LIST.filter((module) => module.phase === undefined);
  return ready.map((module, index) =>
    defineAction({
      id: `view.${module.id}`,
      label: `Show ${module.label}`,
      group: "View",
      shortcut: `Mod+${index + 1}`,
      run: () => showModule(module.id),
    }),
  );
}

function repositoryActions(session: RepoSession): Action[] {
  return [
    defineAction({
      id: "repository.open",
      label: "Open a repository…",
      group: "Repository",
      shortcut: "Mod+O",
      run: () => session.pick(),
    }),
    cloneAction(session.open),
    defineAction({
      id: "repository.list",
      label: "Show the recent repositories",
      group: "Repository",
      blocked: session.path === null ? "No repository is open." : undefined,
      run: () => session.close(),
    }),
  ];
}

function calmAction(motion: Motion): Action {
  return defineAction({
    id: "view.calm",
    label: motion.calm ? "Turn off calm mode" : "Turn on calm mode",
    group: "View",
    blocked: motion.systemCalm
      ? "Your system asks for reduced motion."
      : undefined,
    run: () => motion.setCalmSetting(!motion.calmSetting),
  });
}
