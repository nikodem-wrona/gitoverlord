import { type Action, defineAction } from "@/actions";
import type { RepoSession } from "@/features/repository";
import { cloneAction } from "@/features/sync";
import { type Motion, type Sound, type Theme, THEMES } from "@/hud";

import { MODULE_LIST, type ModuleId } from "./modules";

interface AppState {
  session: RepoSession;
  motion: Motion;
  theme: Theme;
  sound: Sound;
  showModule(id: ModuleId): void;
}

/** The actions of the application: the modules, the repositories, calm mode, the themes, and the sound. */
export function appActions(state: AppState): Action[] {
  return [
    ...moduleActions(state.showModule),
    ...repositoryActions(state.session),
    calmAction(state.motion),
    ...themeActions(state.theme),
    soundAction(state.sound),
  ];
}

/** One action for each module. `Mod+1` shows the first module. */
function moduleActions(showModule: (id: ModuleId) => void): Action[] {
  return MODULE_LIST.map((module, index) =>
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

/** One action for each theme that is not in use. */
function themeActions({ theme, setTheme }: Theme): Action[] {
  const others = THEMES.filter((item) => item.id !== theme);
  return others.map((item) =>
    defineAction({
      id: `view.theme:${item.id}`,
      label: `Use the ${item.label} theme`,
      group: "View",
      run: () => setTheme(item.id),
    }),
  );
}

function soundAction({ enabled, setEnabled }: Sound): Action {
  return defineAction({
    id: "view.sound",
    label: enabled ? "Turn off the sound" : "Turn on the sound",
    group: "View",
    run: () => setEnabled(!enabled),
  });
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
