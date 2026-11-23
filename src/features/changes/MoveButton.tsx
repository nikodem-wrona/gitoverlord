import { ActionButton } from "@/actions";
import type { RepoWriter } from "@/features/repository";

import { filePaths, stageAction, unstageAction } from "./changeActions";
import type { ChangeRow } from "./changeRows";

/** Stages an unstaged file, or unstages a staged file. */
export function MoveButton({
  repo,
  row,
}: {
  repo: RepoWriter;
  row: ChangeRow;
}) {
  const files = filePaths([row]);
  const action =
    row.area === "staged"
      ? unstageAction(repo, files, {
          id: `changes.unstage:${row.path}`,
          label: `Unstage ${row.path}`,
        })
      : stageAction(repo, files, {
          id: `changes.stage:${row.path}`,
          label: `Stage ${row.path}`,
        });
  return (
    <ActionButton
      action={action}
      compact
      text={row.area === "staged" ? "Unstage" : "Stage"}
    />
  );
}
