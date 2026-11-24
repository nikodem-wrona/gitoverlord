import { useState } from "react";

import {
  Button,
  Checkbox,
  Menu,
  type MenuPoint,
  Panel,
  TabPanel,
  Tabs,
} from "@/hud";

import styles from "./Gallery.module.css";

const MENU_ITEMS = [
  { id: "pick", label: "Cherry-pick b7e41c9 onto main" },
  { id: "revert", label: "Revert b7e41c9", blocked: "Finish the merge first." },
  { id: "reset", label: "Reset main to b7e41c9…", danger: true },
];

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
      <MenuDemo />
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

/** A button that opens a menu under it. */
function MenuDemo() {
  const [at, setAt] = useState<MenuPoint | null>(null);
  const [picked, setPicked] = useState("None");
  return (
    <Panel title="Menu">
      <div className={styles.row}>
        <Button
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            setAt(at ? null : { x: box.left, y: box.bottom + 2 });
          }}
        >
          Commit commands ▾
        </Button>
        <span className={styles.note}>Last item: {picked}</span>
      </div>
      {at && (
        <Menu
          label="Commit commands"
          items={MENU_ITEMS}
          at={at}
          onSelect={(id) => {
            setPicked(id);
            setAt(null);
          }}
          onClose={() => setAt(null)}
        />
      )}
    </Panel>
  );
}
