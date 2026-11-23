import { Button, EmptyState, Panel, useToast } from "@/hud";

import styles from "./Gallery.module.css";

/** Notifications and the empty state. */
export function FeedbackSection() {
  const toast = useToast();

  return (
    <>
      <Panel title="Notifications">
        <div className={styles.row}>
          <Button
            onClick={() =>
              toast.info("Uplink stable", "Sync arrives in phase 4.")
            }
          >
            Info
          </Button>
          <Button
            onClick={() =>
              toast.ok("Commit saved", "b7e41c9 is on feat/hud-kit.")
            }
          >
            Ok
          </Button>
          <Button
            variant="danger"
            onClick={() =>
              toast.fail("Push rejected", "Pull the remote changes first.")
            }
          >
            Fail
          </Button>
        </div>
      </Panel>
      <Panel title="Empty state" flush>
        <EmptyState
          title="Module offline"
          message="This module arrives in phase 5."
        />
      </Panel>
    </>
  );
}
