import { useState } from "react";

import { CommitInspector, StarMap } from "@/features/history";
import { RepoNavigator, SAMPLE_REPOSITORY } from "@/features/repository";
import { ActivityPanel, SyncPanel } from "@/features/telemetry";
import { Tabs } from "@/hud";

import styles from "./AppShell.module.css";
import {
  isModuleId,
  MODULE_LIST,
  MODULE_TABS_ID,
  type ModuleId,
} from "./modules";
import { StatusBar } from "./StatusBar";
import { TopBar } from "./TopBar";
import { Workspace } from "./Workspace";

const REPOSITORY = SAMPLE_REPOSITORY;
const HEAD_HASH = REPOSITORY.commits.find(
  (commit) => commit.lane === REPOSITORY.head,
)?.hash;

/** The main layout: top bar, module tabs, three columns, and the status bar. */
export function AppShell() {
  const [moduleId, setModuleId] = useState<ModuleId>("history");
  const [selectedHash, setSelectedHash] = useState(HEAD_HASH);
  const selected = REPOSITORY.commits.find(
    (commit) => commit.hash === selectedHash,
  );

  return (
    <div className={styles.shell}>
      <TopBar repository={REPOSITORY} />
      <div className={styles.modules}>
        <Tabs
          label="Modules"
          idPrefix={MODULE_TABS_ID}
          tabs={MODULE_LIST}
          activeId={moduleId}
          onChange={(id) => isModuleId(id) && setModuleId(id)}
        />
      </div>
      <aside className={styles.left} aria-label="Repository overview">
        <RepoNavigator repository={REPOSITORY} delay={80} />
        <ActivityPanel activity={REPOSITORY.activity} delay={160} />
        <SyncPanel
          remote={REPOSITORY.remotes[0] ?? "origin"}
          ahead={REPOSITORY.ahead}
          behind={REPOSITORY.behind}
          delay={240}
        />
      </aside>
      <main className={styles.center}>
        <StarMap
          commits={REPOSITORY.commits}
          headHash={HEAD_HASH}
          selectedHash={selectedHash}
          onSelect={setSelectedHash}
          delay={120}
        />
        <Workspace
          moduleId={moduleId}
          repository={REPOSITORY}
          selectedHash={selectedHash}
          onSelectCommit={setSelectedHash}
        />
      </main>
      <aside className={styles.right} aria-label="Inspector">
        <CommitInspector commit={selected} delay={200} />
      </aside>
      <StatusBar />
    </div>
  );
}
