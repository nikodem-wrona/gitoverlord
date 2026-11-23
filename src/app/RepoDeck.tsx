import { useCallback, useState } from "react";

import { DiffPanel } from "@/features/diff";
import {
  CommitInspector,
  CommitTimeline,
  useHistory,
} from "@/features/history";
import {
  RepoNavigator,
  useRepoSummary,
  useRepoWatcher,
} from "@/features/repository";
import { ActivityPanel, SyncPanel } from "@/features/telemetry";
import type { DiffTarget } from "@/ipc";

import styles from "./AppShell.module.css";
import type { ModuleId } from "./modules";
import { Workspace } from "./Workspace";

interface RepoDeckProps {
  repoPath: string;
  moduleId: ModuleId;
}

/** The file in the diff viewer, and the module tab that opened it. */
interface Inspection {
  moduleId: ModuleId;
  target: DiffTarget;
}

/** The three columns of an open repository. The diff viewer covers the timeline. */
export function RepoDeck({ repoPath, moduleId }: RepoDeckProps) {
  useRepoWatcher(repoPath);
  const headHash = useRepoSummary(repoPath).data?.head.hash ?? undefined;
  const history = useHistory(repoPath);
  const [pickedHash, setPickedHash] = useState<string>();
  const { target, inspect, closeDiff } = useInspection(moduleId);
  const selectedHash = pickedHash ?? headHash;
  const selectCommit = (hash: string) => {
    setPickedHash(hash);
    closeDiff();
  };

  return (
    <>
      <Overview repoPath={repoPath} />
      <main className={styles.center}>
        {target ? (
          <DiffPanel repoPath={repoPath} target={target} onClose={closeDiff} />
        ) : (
          <CommitTimeline
            commits={history.commits}
            headHash={headHash}
            selectedHash={selectedHash}
            onSelect={selectCommit}
            delay={120}
          />
        )}
        <Workspace
          moduleId={moduleId}
          repoPath={repoPath}
          history={history}
          selectedHash={selectedHash}
          onSelectCommit={selectCommit}
          target={target}
          onInspect={inspect}
        />
      </main>
      <aside className={styles.right} aria-label="Inspector">
        <CommitInspector
          repoPath={repoPath}
          hash={selectedHash}
          selectedPath={target?.kind === "commit" ? target.path : undefined}
          onSelectFile={inspect}
          delay={200}
        />
      </aside>
    </>
  );
}

/** Holds the file in the diff viewer. A different module tab closes the viewer. */
function useInspection(moduleId: ModuleId) {
  const [inspection, setInspection] = useState<Inspection>();
  const target =
    inspection?.moduleId === moduleId ? inspection.target : undefined;
  const closeDiff = useCallback(() => setInspection(undefined), []);
  const inspect = (next: DiffTarget) =>
    setInspection({ moduleId, target: next });

  return { target, inspect, closeDiff };
}

function Overview({ repoPath }: { repoPath: string }) {
  return (
    <aside className={styles.left} aria-label="Repository overview">
      <RepoNavigator repoPath={repoPath} delay={80} />
      <ActivityPanel repoPath={repoPath} delay={160} />
      <SyncPanel repoPath={repoPath} delay={240} />
    </aside>
  );
}
