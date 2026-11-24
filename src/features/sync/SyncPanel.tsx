import { ActionButton } from "@/actions";
import {
  formatTime,
  type RepoWriter,
  useBranches,
  useRepoSummary,
  useRepoWriter,
} from "@/features/repository";
import { useHistoryState } from "@/features/surgery";
import { Meter, Panel } from "@/hud";
import type { Branch, SyncProgress } from "@/ipc";

import styles from "./SyncPanel.module.css";
import { SyncStep } from "./SyncStep";
import { upstreamActions } from "./upstreamActions";
import { useBackgroundFetch } from "./useBackgroundFetch";
import { useSyncProgress } from "./useSyncProgress";

const GAUGE_MAX = 10;

interface SyncPanelProps {
  repoPath: string;
  delay?: number;
}

/**
 * Gauges for the commits of the current branch that are not pushed and not
 * pulled, and the progress of the running network operation. The counts
 * compare with the last fetch.
 *
 * While the panel shows, it fetches the remotes in the background.
 */
export function SyncPanel({ repoPath, delay }: SyncPanelProps) {
  const summary = useRepoSummary(repoPath).data;
  const branches = useBranches(repoPath).data ?? [];
  const current = branches.find((branch) => branch.current);
  const progress = useSyncProgress(repoPath);
  const repo = useRepoWriter(repoPath);
  const fetchError = useBackgroundFetch(repo, summary);

  return (
    <Panel
      title="Sync status"
      meta={current?.upstream ?? "No upstream"}
      delay={delay}
    >
      <div className={styles.meters}>
        <Meter
          label="Ahead"
          value={current?.ahead ?? 0}
          max={GAUGE_MAX}
          tone="active"
        />
        <Meter
          label="Behind"
          value={current?.behind ?? 0}
          max={GAUGE_MAX}
          tone="fail"
        />
        <SyncState
          progress={progress}
          fetched={summary?.fetched}
          error={fetchError}
        />
        <DivergedTools repo={repo} branch={current} />
      </div>
    </Panel>
  );
}

/** Merge, rebase, and force push buttons when the branch and its upstream both have new commits. */
function DivergedTools({
  repo,
  branch,
}: {
  repo: RepoWriter;
  branch?: Branch;
}) {
  const state = useHistoryState(repo.path);
  const [merge, rebase, force] = upstreamActions(repo, state, branch);
  if (!merge || !rebase || !force) return null;
  return (
    <div className={styles.diverged}>
      <p className={styles.status} data-tone="warn">
        Both sides have new commits
      </p>
      <div className={styles.tools}>
        <ActionButton action={merge} compact text="Merge upstream" />
        <ActionButton action={rebase} compact text="Rebase…" />
        <ActionButton
          action={force}
          variant="danger"
          compact
          text="Force push…"
        />
      </div>
    </div>
  );
}

interface SyncStateProps {
  progress: SyncProgress | null;
  fetched?: number | null;
  error: string | null;
}

/** The running operation, else the error of the background fetch, else the time of the last fetch. */
function SyncState({ progress, fetched, error }: SyncStateProps) {
  if (progress) return <SyncStep progress={progress} />;
  if (error) {
    return (
      <p className={styles.status} data-tone="fail" title={error}>
        Background fetch failed
      </p>
    );
  }
  return (
    <p className={styles.status}>
      {fetched ? `Fetched ${formatTime(fetched)}` : "Not fetched"}
    </p>
  );
}
