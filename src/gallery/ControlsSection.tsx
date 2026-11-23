import { useState } from "react";

import { Button, Checkbox, Panel, TabPanel, Tabs } from "@/hud";

import styles from "./Gallery.module.css";

const TABS = [
  { id: "tracking", label: "Tracking" },
  { id: "analysis", label: "Analysis" },
  { id: "scan", label: "Scan" },
];

/** Buttons, check boxes, and tabs. */
export function ControlsSection() {
  const [checked, setChecked] = useState(true);
  const [tab, setTab] = useState("tracking");

  return (
    <>
      <Panel title="Buttons">
        <div className={styles.row}>
          <Button variant="primary">Primary</Button>
          <Button>Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Panel>
      <Panel title="Check boxes">
        <div className={styles.row}>
          <Checkbox label="Selected" checked={checked} onChange={setChecked} />
          <Checkbox
            label="Disabled"
            checked={false}
            onChange={() => {}}
            disabled
          />
        </div>
      </Panel>
      <Panel title="Tabs">
        <Tabs
          label="Gallery tabs"
          idPrefix="gallery"
          tabs={TABS}
          activeId={tab}
          onChange={setTab}
        />
        <TabPanel idPrefix="gallery" activeId={tab}>
          <p className={styles.note}>
            Active tab: {tab}. The arrow keys move between tabs.
          </p>
        </TabPanel>
      </Panel>
    </>
  );
}
