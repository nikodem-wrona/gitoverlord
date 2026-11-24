import { useQueryClient } from "@tanstack/react-query";

import { useActions } from "@/actions";
import { StatusButton } from "@/hud";

import { APP_VERSION, useAppUpdate } from "./queries";
import { installUpdateAction } from "./updateActions";
import styles from "./UpdateStatus.module.css";

/** The version in the status bar. When a newer version is available, a button installs it. */
export function UpdateStatus() {
  const client = useQueryClient();
  const update = useAppUpdate().data;
  const { run } = useActions();

  if (!update) return <span>Version {APP_VERSION}</span>;
  const action = installUpdateAction(client, update);
  return (
    <StatusButton
      data-tone="active"
      className={styles.update}
      title={`Version ${update.currentVersion}. ${action.label}`}
      onClick={() => run(action)}
    >
      Update to {update.version}
    </StatusButton>
  );
}
