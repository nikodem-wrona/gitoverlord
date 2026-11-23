import { Panel, StatusLine } from "@/hud";

import { describeGit } from "./describeGit";
import styles from "./SystemStatus.module.css";
import { useGitVersion } from "./useGitVersion";

/** Shows the result of the startup checks. */
export function SystemStatus() {
  const git = describeGit(useGitVersion());

  return (
    <Panel title="System check">
      <div role="status">
        <StatusLine label="Git" state={git.state} value={git.value} />
        {git.hint && <p className={styles.hint}>{git.hint}</p>}
      </div>
    </Panel>
  );
}
