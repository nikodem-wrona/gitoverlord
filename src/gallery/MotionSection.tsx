import { useState } from "react";

import { Button, DecodeText, Panel, PulseDot, StatusLine } from "@/hud";

import styles from "./Gallery.module.css";

/** Text decode, pulse lights, status lines, and the panel reveal. */
export function MotionSection() {
  const [run, setRun] = useState(0);
  const replay = () => setRun((count) => count + 1);

  return (
    <>
      <Panel key={run} title="Decode and reveal" meta={`Run ${run + 1}`}>
        <div className={styles.stack}>
          <DecodeText
            text="Access granted"
            duration={900}
            className={styles.decoded}
          />
          <div>
            <Button variant="primary" onClick={replay}>
              Replay
            </Button>
          </div>
        </div>
      </Panel>
      <Panel title="Pulse lights">
        <div className={styles.row}>
          <PulseDot tone="accent" pulse />
          <PulseDot tone="ok" pulse />
          <PulseDot tone="warn" pulse />
          <PulseDot tone="fail" pulse />
          <PulseDot tone="dim" />
        </div>
      </Panel>
      <Panel title="Status lines">
        <div className={styles.stack}>
          <StatusLine label="Uplink" state="pending" value="Scanning" />
          <StatusLine label="Git core" state="ok" value="2.54.0" />
          <StatusLine label="Remote" state="fail" value="Offline" />
        </div>
      </Panel>
    </>
  );
}
