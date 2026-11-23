import { useState } from "react";

import { Button, Dialog, Panel, TextField, ToolLayout } from "@/hud";

import styles from "./Gallery.module.css";

/** Text fields, the toolbar layout, compact buttons, and the dialog. */
export function FormsSection() {
  return (
    <>
      <TextFieldPanel />
      <ToolbarPanel />
    </>
  );
}

function TextFieldPanel() {
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <Panel title="Text fields">
      <div className={styles.stack}>
        <TextField
          label="Summary"
          value={summary}
          onChange={setSummary}
          placeholder="Say what the commit changes"
          hint={`${summary.length}/72`}
        />
        <TextField
          label="Description"
          rows={3}
          value={notes}
          onChange={setNotes}
          placeholder="A text area"
        />
      </div>
    </Panel>
  );
}

function ToolbarPanel() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const tools = (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <Button compact>Compact</Button>
      <Button compact busy>
        Busy
      </Button>
    </>
  );
  const footer = (
    <>
      <Button onClick={close}>Cancel</Button>
      <Button variant="danger" onClick={close}>
        Delete
      </Button>
    </>
  );

  return (
    <Panel title="Toolbar and dialog" flush>
      <ToolLayout label="Gallery tools" tools={tools}>
        <p className={styles.note}>The content takes the free height.</p>
      </ToolLayout>
      {open && (
        <Dialog title="Delete branch" onClose={close} footer={footer}>
          <p>The Escape key and a click outside close the dialog.</p>
        </Dialog>
      )}
    </Panel>
  );
}
