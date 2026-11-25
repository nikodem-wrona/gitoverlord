import { GitHubAppOptions } from "@/features/github";
import { Button, Dialog } from "@/hud";

/** The options of the application. Each section saves its own options. */
export function OptionsDialog({ onClose }: { onClose(): void }) {
  return (
    <Dialog
      title="Options"
      onClose={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <GitHubAppOptions onSaved={onClose} />
    </Dialog>
  );
}
