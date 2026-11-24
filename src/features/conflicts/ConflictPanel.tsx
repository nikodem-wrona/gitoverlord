import { QueryView, useConflictFile } from "@/features/repository";
import { Panel, useEscapeKey } from "@/hud";

import { conflictCount } from "./conflictRows";
import { ConflictResolver } from "./ConflictResolver";

interface ConflictPanelProps {
  repoPath: string;
  /** The file with conflicts. */
  path: string;
  /** Runs when the user closes the panel with the button or with the Escape key. */
  onClose(): void;
  /** Runs after the file is resolved and staged. */
  onResolved(path: string): void;
  delay?: number;
}

/** The conflict resolver for one file: choose the lines of each conflict, then stage the file. */
export function ConflictPanel(props: ConflictPanelProps) {
  const { repoPath, path, onClose, onResolved, delay } = props;
  const file = useConflictFile(repoPath, path);
  useEscapeKey(onClose);
  const count = file.data ? conflictCount(file.data.blocks) : undefined;

  return (
    <Panel
      title="Conflict resolver"
      meta={count === undefined ? "Scanning" : `${count} conflicts`}
      flush
      delay={delay}
    >
      <QueryView query={file}>
        {(data) => (
          <ConflictResolver
            // A new count of conflicts starts the choices again.
            key={`${data.path}:${conflictCount(data.blocks)}`}
            repoPath={repoPath}
            file={data}
            onClose={onClose}
            onResolved={() => onResolved(data.path)}
          />
        )}
      </QueryView>
    </Panel>
  );
}
