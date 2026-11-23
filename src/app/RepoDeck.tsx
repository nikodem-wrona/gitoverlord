import { useCallback, useState } from "react";

import { CommitComposer } from "@/features/commit";
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
import { useRepoActions } from "./useRepoActions";
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
  useRepoActions(repoPath);
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
      <Inspector
        repoPath={repoPath}
        moduleId={moduleId}
        hash={selectedHash}
        target={target}
        onSelectFile={inspect}
      />
    </>
  );
}

interface InspectorProps {
  repoPath: string;
  moduleId: ModuleId;
  hash?: string;
  /** The file that the diff viewer shows. */
  target?: DiffTarget;
  onSelectFile(target: DiffTarget): void;
}

/** The right column: the commit console on the Changes tab, else the commit inspector. */
function Inspector(props: InspectorProps) {
  const { repoPath, target } = props;
  return (
    <aside className={styles.right} aria-label="Inspector">
      {props.moduleId === "changes" ? (
        <CommitComposer repoPath={repoPath} delay={200} />
      ) : (
        <CommitInspector
          repoPath={repoPath}
          hash={props.hash}
          selectedPath={target?.kind === "commit" ? target.path : undefined}
          onSelectFile={props.onSelectFile}
          delay={200}
        />
      )}
    </aside>
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
