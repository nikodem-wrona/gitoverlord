import { formatShortcut, isMac, PALETTE_SHORTCUT, useActions } from "@/actions";
import { shortHash, useBranches, useRepoSummary } from "@/features/repository";
import {
  Button,
  CalmToggle,
  DecodeText,
  LogoMark,
  Readout,
  useToast,
} from "@/hud";
import type { Head } from "@/ipc";

import styles from "./TopBar.module.css";

interface TopBarProps {
  /** The path of the open repository. `null` when no repository is open. */
  repoPath: string | null;
  /** Goes to the list of repositories. */
  onShowRepositories(): void;
}

/** The brand, the repository readouts, the commands, and calm mode. */
export function TopBar({ repoPath, onShowRepositories }: TopBarProps) {
  const toast = useToast();
  const { openPalette } = useActions();
  const syncOffline = () =>
    toast.info("Sync is offline", "Fetch, pull, and push arrive in phase 4.");

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
        <Button onClick={syncOffline}>Fetch</Button>
        <Button onClick={syncOffline}>Pull</Button>
        <Button variant="primary" onClick={syncOffline}>
          Push
        </Button>
        <CalmToggle />
      </div>
    </header>
  );
}

function RepoReadouts({ repoPath }: { repoPath: string }) {
  const summary = useRepoSummary(repoPath).data;
  const branches = useBranches(repoPath).data ?? [];
  const current = branches.find((branch) => branch.current);
  const sync = current?.upstream
    ? `↑${current.ahead}  ↓${current.behind}`
    : "No upstream";

  return (
    <>
      <Readout label="Repository" value={summary?.name ?? "Scanning"} />
      <Readout
        label="Branch"
        value={summary ? headLabel(summary.head) : "Scanning"}
      />
      <Readout label="Sync" value={sync} />
    </>
  );
}

function headLabel(head: Head): string {
  if (head.branch !== null) return head.branch;
  return head.hash === null
    ? "No commits"
    : `Detached at ${shortHash(head.hash)}`;
}
