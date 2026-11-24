import { useMemo, useState } from "react";

import { type Action, ActionButton, ActionMenuButton } from "@/actions";
import { useRepoWriter } from "@/features/repository";
import { Button, EmptyState, PathText, useRowWindow } from "@/hud";
import type { ConflictChoice, ConflictFile } from "@/ipc";

import {
  keepSideAction,
  markResolvedAction,
  resolveAction,
} from "./conflictActions";
import { ConflictLines } from "./ConflictLines";
import styles from "./ConflictPanel.module.css";
import { conflictCount, conflictRows, sideLabels } from "./conflictRows";

interface ConflictResolverProps {
  repoPath: string;
  file: ConflictFile;
  onClose(): void;
  onResolved(): void;
}

type Choices = (ConflictChoice | undefined)[];

/** The toolbar and the lines of one file with conflicts. */
export function ConflictResolver(props: ConflictResolverProps) {
  const { repoPath, file, onClose, onResolved } = props;
  const repo = useRepoWriter(repoPath);
  const count = conflictCount(file.blocks);
  const [choices, setChoices] = useState<Choices>(() =>
    Array(count).fill(undefined),
  );
  const labels = sideLabels(file.blocks);
  const sides = [
    keepSideAction(repo, file.path, "ours", labels.ours, onResolved),
    keepSideAction(repo, file.path, "theirs", labels.theirs, onResolved),
  ];
  const resolve =
    count > 0 ? resolveAction(repo, file.path, choices, onResolved) : undefined;

  return (
    <div className={styles.viewer}>
      <div role="toolbar" aria-label="Conflict commands" className={styles.bar}>
        <span className={styles.path}>
          <PathText path={file.path} />
        </span>
        {resolve && (
          <ChoiceTools
            resolve={resolve}
            onChooseAll={(choice) => setChoices(Array(count).fill(choice))}
          />
        )}
        <ActionMenuButton
          label="Whole file"
          text="Whole file"
          compact
          actions={sides}
        />
        <Button compact onClick={onClose}>
          Close
        </Button>
      </div>
      <div className={styles.lines}>
        {count > 0 ? (
          <ResolverLines file={file} choices={choices} onChange={setChoices} />
        ) : (
          <NoMarkers repoPath={repoPath} file={file} onResolved={onResolved} />
        )}
      </div>
    </div>
  );
}

interface ChoiceToolsProps {
  resolve: Action;
  onChooseAll(choice: ConflictChoice): void;
}

/** Chooses one side for each conflict, and resolves the file with the choices. */
function ChoiceTools({ resolve, onChooseAll }: ChoiceToolsProps) {
  return (
    <>
      <Button compact onClick={() => onChooseAll("ours")}>
        All current
      </Button>
      <Button compact onClick={() => onChooseAll("theirs")}>
        All incoming
      </Button>
      <ActionButton
        action={resolve}
        variant="primary"
        compact
        text="Resolve file"
      />
    </>
  );
}

interface ResolverLinesProps {
  file: ConflictFile;
  choices: Choices;
  onChange(choices: Choices): void;
}

function ResolverLines({ file, choices, onChange }: ResolverLinesProps) {
  const rows = useMemo(() => conflictRows(file.blocks), [file.blocks]);
  const control = useRowWindow(rows.length);
  const choose = (index: number, choice: ConflictChoice) =>
    onChange(choices.map((old, at) => (at === index ? choice : old)));

  return (
    <ConflictLines
      label={`Conflicts of ${file.path}`}
      rows={rows}
      control={control}
      choices={choices}
      onChoose={choose}
    />
  );
}

interface NoMarkersProps {
  repoPath: string;
  file: ConflictFile;
  onResolved(): void;
}

/** A file that only a full side can resolve, or a file that has no markers now. */
function NoMarkers({ repoPath, file, onResolved }: NoMarkersProps) {
  const repo = useRepoWriter(repoPath);
  if (!file.text) {
    return (
      <EmptyState
        title="No lines to merge"
        message={`${reason(file)} Keep one side with the Whole file menu.`}
      />
    );
  }
  const mark = markResolvedAction(repo, file.path, onResolved);
  return (
    <EmptyState
      title="No conflict markers"
      message="The file has no conflict markers now. Mark it as resolved to stage it."
      action={
        <ActionButton action={mark} variant="primary" text="Mark as resolved" />
      }
    />
  );
}

function reason(file: ConflictFile): string {
  if (file.oursDeleted) return "The current branch deleted the file.";
  if (file.theirsDeleted) return "The incoming commit deleted the file.";
  return "The file is not text.";
}
