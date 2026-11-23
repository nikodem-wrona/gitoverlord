import { useEffect } from "react";

import { QueryView, shortHash, useFileDiff } from "@/features/repository";
import { Button, Panel, PathText } from "@/hud";
import type { DiffTarget } from "@/ipc";

import styles from "./DiffPanel.module.css";
import { DiffView } from "./DiffView";

interface DiffPanelProps {
  repoPath: string;
  target: DiffTarget;
  /** Runs when the user closes the viewer with the button or with the Escape key. */
  onClose(): void;
  delay?: number;
}

/** The diff viewer for one file of a commit, of the index, or of the working tree. */
export function DiffPanel({
  repoPath,
  target,
  onClose,
  delay,
}: DiffPanelProps) {
  const diff = useFileDiff(repoPath, target);
  useEscapeKey(onClose);

  return (
    <Panel title="Diff scan" meta={sourceOf(target)} flush delay={delay}>
      <div className={styles.viewer}>
        <div className={styles.bar}>
          <span className={styles.path}>
            <PathText path={target.path} />
          </span>
          <Button onClick={onClose}>Close</Button>
        </div>
        <div className={styles.lines}>
          <QueryView query={diff}>
            {(data) => (
              <DiffView label={`Diff of ${target.path}`} diff={data} />
            )}
          </QueryView>
        </div>
      </div>
    </Panel>
  );
}

/** Names the two versions that the diff compares. */
function sourceOf(target: DiffTarget): string {
  switch (target.kind) {
    case "commit":
      return `Commit ${shortHash(target.hash)}`;
    case "staged":
      return "Staged against HEAD";
    case "unstaged":
      return "Working tree against the index";
  }
}

function useEscapeKey(onEscape: () => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onEscape]);
}
