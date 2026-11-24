import { useState } from "react";

import { useRegisterActions } from "@/actions";
import { CloneFromGitHubButton, GitHubProvider } from "@/features/github";
import { RepoDock, useRepoSession } from "@/features/repository";
import { CloneControl } from "@/features/sync";
import { useUpdateActions } from "@/features/update";
import { Tabs, useMotion, useSound, useTheme } from "@/hud";

import { appActions } from "./appActions";
import styles from "./AppShell.module.css";
import {
  isModuleId,
  MODULE_LIST,
  MODULE_TABS_ID,
  type ModuleId,
} from "./modules";
import { RepoDeck } from "./RepoDeck";
import { StatusBar } from "./StatusBar";
import { TopBar } from "./TopBar";

/**
 * The main layout: top bar, module tabs, the repository, and the status bar.
 *
 * Without an open repository, the dock shows in place of the three columns.
 */
export function AppShell() {
  const session = useRepoSession();
  const [moduleId, setModuleId] = useState<ModuleId>("history");
  const motion = useMotion();
  const theme = useTheme();
  const sound = useSound();
  useRegisterActions(
    appActions({ session, motion, theme, sound, showModule: setModuleId }),
  );
  useUpdateActions();

  return (
    <GitHubProvider onCloned={session.open}>
      <div className={styles.shell}>
        <TopBar repoPath={session.path} onShowRepositories={session.close} />
        {session.path !== null && (
          // The tabs control the panels of an open repository.
          <nav className={styles.modules} aria-label="Modules">
            <Tabs
              label="Modules"
              idPrefix={MODULE_TABS_ID}
              tabs={MODULE_LIST}
              activeId={moduleId}
              onChange={(id) => isModuleId(id) && setModuleId(id)}
            />
          </nav>
        )}
        {session.path === null ? (
          <main className={styles.dock}>
            <RepoDock session={session}>
              <CloneControl onCloned={session.open} />
              <CloneFromGitHubButton />
            </RepoDock>
          </main>
        ) : (
          // A new repository starts with a new selection.
          <RepoDeck
            key={session.path}
            repoPath={session.path}
            moduleId={moduleId}
          />
        )}
        <StatusBar />
      </div>
    </GitHubProvider>
  );
}
