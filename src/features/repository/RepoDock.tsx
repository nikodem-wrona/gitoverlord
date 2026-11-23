import {
  Button,
  type Column,
  EmptyState,
  LogoMark,
  Panel,
  Table,
  textColumn,
} from "@/hud";
import type { RecentRepo } from "@/ipc";

import { useRecentRepositories } from "./queries";
import styles from "./RepoDock.module.css";
import type { RepoSession } from "./useRepoSession";

const COLUMNS: readonly Column<RecentRepo>[] = [
  textColumn<RecentRepo>("name", "Repository", { width: "14rem" }),
  textColumn<RecentRepo>("path", "Path"),
];

/** The start screen: open a folder, or select a repository that was open before. */
export function RepoDock({ session }: { session: RepoSession }) {
  const recent = useRecentRepositories().data ?? [];

  return (
    <Panel
      title="Repository link"
      meta={session.opening ? "Linking" : "Standby"}
      className={styles.dock}
    >
      <div className={styles.content}>
        <div className={styles.intro}>
          <LogoMark size="3.5rem" />
          <h2 className={styles.title}>Select a repository</h2>
          <p className={styles.hint}>
            Open a folder that contains a git repository. gitoverlord reads it
            and does not change it.
          </p>
          <Button
            variant="primary"
            onClick={session.pick}
            disabled={session.opening}
          >
            Open a folder
          </Button>
        </div>
        <div className={styles.recent}>
          {recent.length > 0 ? (
            <Table
              label="Recent repositories"
              columns={COLUMNS}
              rows={recent}
              getRowKey={(repo) => repo.path}
              onSelect={session.open}
            />
          ) : (
            <EmptyState
              title="No recent repositories"
              message="The repositories that you open show here."
            />
          )}
        </div>
      </div>
    </Panel>
  );
}
