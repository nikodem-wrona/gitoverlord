import { useState } from "react";

import { ActionButton, useRegisterActions } from "@/actions";
import {
  useCommitDetail,
  useRepoSummary,
  useRepoWriter,
  useWorkingTree,
} from "@/features/repository";
import { Checkbox, Panel, TextField } from "@/hud";
import type { CommitDetail } from "@/ipc";

import { commitAction, type CommitDraft, EMPTY_DRAFT } from "./commitAction";
import styles from "./CommitComposer.module.css";

/** Git tools show this many characters of a summary on one line. */
const SUMMARY_LIMIT = 72;

interface CommitComposerProps {
  repoPath: string;
  delay?: number;
}

/** Writes the message of the next commit and commits the staged changes. */
export function CommitComposer({ repoPath, delay }: CommitComposerProps) {
  const repo = useRepoWriter(repoPath);
  const staged = useWorkingTree(repoPath).data?.staged.length ?? 0;
  const headHash = useRepoSummary(repoPath).data?.head.hash ?? undefined;
  const head = useCommitDetail(repoPath, headHash).data;
  const [draft, setDraft] = useState<CommitDraft>(EMPTY_DRAFT);
  const update = (change: Partial<CommitDraft>) =>
    setDraft((old) => ({ ...old, ...change }));

  const action = commitAction(
    repo,
    draft,
    { staged, hasHead: headHash !== undefined },
    () => setDraft(EMPTY_DRAFT),
  );
  useRegisterActions([action]);

  return (
    <Panel title="Commit console" meta={`${staged} staged`} delay={delay}>
      <div className={styles.form}>
        <TextField
          label="Summary"
          value={draft.summary}
          onChange={(summary) => update({ summary })}
          placeholder="Say what the commit changes"
          hint={`${draft.summary.length}/${SUMMARY_LIMIT}`}
        />
        <TextField
          label="Description"
          rows={6}
          value={draft.description}
          onChange={(description) => update({ description })}
          placeholder="Say why the change is necessary. This is optional."
        />
        <Checkbox
          label="Amend the last commit"
          checked={draft.amend}
          disabled={headHash === undefined}
          onChange={(amend) => setDraft(withAmend(draft, amend, head))}
        />
        <ActionButton
          action={action}
          variant="primary"
          text={draft.amend ? "Amend" : "Commit"}
        />
      </div>
    </Panel>
  );
}

/** An amend of an empty draft starts with the message of the last commit. */
function withAmend(
  draft: CommitDraft,
  amend: boolean,
  head?: CommitDetail,
): CommitDraft {
  const empty = draft.summary === "" && draft.description === "";
  if (!amend || !empty || !head) return { ...draft, amend };
  return {
    summary: head.commit.subject,
    description: head.body.trim(),
    amend,
  };
}
