import { CommitComposer } from "@/features/commit";
import { CommitInspector } from "@/features/history";
import { RepoNavigator, useRepoWatcher } from "@/features/repository";
import { CommitTools, OperationBanner } from "@/features/surgery";
import { SyncPanel } from "@/features/sync";
import { ActivityPanel } from "@/features/telemetry";
import type { Commit, DiffTarget } from "@/ipc";

import styles from "./AppShell.module.css";
import { CenterView } from "./CenterView";
import type { ModuleId } from "./modules";
import { useDeckSelection } from "./useDeckSelection";
import { useRepoActions } from "./useRepoActions";
import { Workspace } from "./Workspace";

interface RepoDeckProps {
  repoPath: string;
  moduleId: ModuleId;
}

/**
 * The three columns of an open repository. The diff viewer and the conflict
 * resolver cover the timeline. A banner shows an operation that stopped.
 */
export function RepoDeck({ repoPath, moduleId }: RepoDeckProps) {
  useRepoWatcher(repoPath);
  const deck = useDeckSelection(repoPath, moduleId);
  useRepoActions(repoPath, deck.selected);

  return (
    <>
      <Overview repoPath={repoPath} />
      <main
        className={styles.center}
        data-operation={deck.operation || undefined}
      >
        <OperationBanner repoPath={repoPath} />
        <CenterView
          repoPath={repoPath}
          history={deck.history}
          headHash={deck.headHash}
          selectedHash={deck.selectedHash}
          onSelectCommit={deck.selectCommit}
          target={deck.target}
          onInspect={deck.inspect}
          onClose={deck.closeDiff}
        />
        <Workspace
          moduleId={moduleId}
          repoPath={repoPath}
          history={deck.history}
          selectedHash={deck.selectedHash}
          onSelectCommit={deck.selectCommit}
          target={deck.target}
          onInspect={deck.inspect}
        />
      </main>
      <Inspector
        repoPath={repoPath}
        moduleId={moduleId}
        hash={deck.selectedHash}
        selected={deck.selected}
        target={deck.target}
        onSelectFile={deck.inspect}
      />
    </>
  );
}

interface InspectorProps {
  repoPath: string;
  moduleId: ModuleId;
  hash?: string;
  /** The selected commit of the history. It gets the commit commands. */
  selected?: Commit;
  /** The file that the diff viewer shows. */
  target?: DiffTarget;
  onSelectFile(target: DiffTarget): void;
}

/** The right column: the commit console on the Changes tab, else the commit inspector. */
function Inspector(props: InspectorProps) {
  const { repoPath, target, selected } = props;
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
          tools={
            selected && <CommitTools repoPath={repoPath} commit={selected} />
          }
          delay={200}
        />
      )}
    </aside>
  );
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
