import { ActionButton } from "@/actions";

import { cloneAction } from "./remoteActions";
import { SyncStep } from "./SyncStep";
import { useSyncProgress } from "./useSyncProgress";

/** The clone button of the start screen, with the progress of the clone. */
export function CloneControl({ onCloned }: { onCloned(path: string): void }) {
  const progress = useSyncProgress(null);
  return (
    <>
      <ActionButton action={cloneAction(onCloned)} text="Clone a repository" />
      {progress && <SyncStep progress={progress} />}
    </>
  );
}
