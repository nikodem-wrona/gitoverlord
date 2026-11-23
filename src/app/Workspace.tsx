import type { ComponentType } from "react";

import { BranchPanel } from "@/features/branches";
import { ChangesPanel } from "@/features/changes";
import { PullRequestPanel } from "@/features/github";
import { CommitLogPanel, type History } from "@/features/history";
import { StashPanel } from "@/features/stash";
import { RemotePanel } from "@/features/sync";
import { TabPanel } from "@/hud";
import type { DiffTarget } from "@/ipc";

import { MODULE_TABS_ID, MODULES, type ModuleId } from "./modules";
import styles from "./Workspace.module.css";

const REVEAL_DELAY = 60;

interface WorkspaceProps {
  moduleId: ModuleId;
  repoPath: string;
  history: History;
  selectedHash?: string;
  onSelectCommit(hash: string): void;
  /** The file that the diff viewer shows. */
  target?: DiffTarget;
  /** Opens a file in the diff viewer. */
  onInspect(target: DiffTarget): void;
}

/** The panel under the timeline. The module tabs choose its content. */
export function Workspace(props: WorkspaceProps) {
  return (
    <TabPanel
      idPrefix={MODULE_TABS_ID}
      activeId={props.moduleId}
      className={styles.workspace}
    >
      <ModulePanel key={props.moduleId} {...props} />
    </TabPanel>
  );
}

/** The panels that take only a title and a repository. */
const PLAIN_PANELS = {
  branches: BranchPanel,
  remotes: RemotePanel,
  pullRequests: PullRequestPanel,
} satisfies Partial<Record<ModuleId, ComponentType<PlainPanelProps>>>;

interface PlainPanelProps {
  title: string;
  repoPath: string;
  delay?: number;
}

function isPlain(id: ModuleId): id is keyof typeof PLAIN_PANELS {
  return Object.hasOwn(PLAIN_PANELS, id);
}

function ModulePanel(props: WorkspaceProps) {
  const { moduleId, repoPath } = props;
  const { title } = MODULES[moduleId];
  if (isPlain(moduleId)) {
    const Plain = PLAIN_PANELS[moduleId];
    return <Plain title={title} repoPath={repoPath} delay={REVEAL_DELAY} />;
  }

  switch (moduleId) {
    case "changes":
      return (
        <ChangesPanel
          title={title}
          repoPath={repoPath}
          selected={props.target}
          onSelect={props.onInspect}
          delay={REVEAL_DELAY}
        />
      );
    case "history":
      return (
        <CommitLogPanel
          title={title}
          history={props.history}
          selectedHash={props.selectedHash}
          onSelect={props.onSelectCommit}
          delay={REVEAL_DELAY}
        />
      );
    case "stash":
      return (
        <StashPanel
          title={title}
          repoPath={repoPath}
          onInspect={props.onSelectCommit}
          delay={REVEAL_DELAY}
        />
      );
  }
}
