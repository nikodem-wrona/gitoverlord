import { formatShortcut, isMac, PALETTE_SHORTCUT, useActions } from "@/actions";
import { AccountButton } from "@/features/github";
import { shortHash, useRepoSummary } from "@/features/repository";
import { SyncButtons } from "@/features/sync";
import { Button, CalmToggle, DecodeText, LogoMark, Readout } from "@/hud";
import type { Head } from "@/ipc";

import styles from "./TopBar.module.css";

interface TopBarProps {
  /** The path of the open repository. `null` when no repository is open. */
  repoPath: string | null;
  /** Goes to the list of repositories. */
  onShowRepositories(): void;
}

/** The brand, the repository readouts, the commands, the sync buttons, and calm mode. */
export function TopBar({ repoPath, onShowRepositories }: TopBarProps) {
  const { openPalette } = useActions();

  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <LogoMark size="1.75rem" />
        <span className={styles.name}>
          <DecodeText text="gitoverlord" duration={900} />
        </span>
      </div>
      <dl className={styles.readouts}>
        {repoPath === null ? (
          <Readout label="Repository" value="No link" />
        ) : (
          <RepoReadouts repoPath={repoPath} />
        )}
      </dl>
      <div className={styles.actions}>
        <Button onClick={openPalette} title="Find a command">
          Commands {formatShortcut(PALETTE_SHORTCUT, isMac())}
        </Button>
        <Button onClick={onShowRepositories} disabled={repoPath === null}>
          Repositories
        </Button>
        <AccountButton />
        {repoPath !== null && <SyncButtons repoPath={repoPath} />}
        <CalmToggle />
      </div>
    </header>
  );
}

/** The pull and push buttons show the counts of the commits, so there is no sync readout. */
function RepoReadouts({ repoPath }: { repoPath: string }) {
  const summary = useRepoSummary(repoPath).data;

  return (
    <>
      <Readout label="Repository" value={summary?.name ?? "Scanning"} />
      <Readout
        label="Branch"
        value={summary ? headLabel(summary.head) : "Scanning"}
      />
    </>
  );
}

function headLabel(head: Head): string {
  if (head.branch !== null) return head.branch;
  return head.hash === null
    ? "No commits"
    : `Detached at ${shortHash(head.hash)}`;
}
