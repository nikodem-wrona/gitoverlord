import { formatTime, shortHash } from "@/features/repository";
import type { Commit } from "@/ipc";

interface SelectionStatusProps {
  commit?: Commit;
  /** `true` while the timeline has the focus. Else the status is empty. */
  focused: boolean;
}

/**
 * Tells a screen reader which commit the arrow keys selected. The drawing is
 * one image, so the selection is not in the accessibility tree.
 */
export function SelectionStatus({ commit, focused }: SelectionStatusProps) {
  const text =
    focused && commit
      ? `${shortHash(commit.hash)}, ${commit.subject}, ${commit.author}, ${formatTime(commit.time)}`
      : "";
  return (
    <p className="visually-hidden" aria-live="polite">
      {text}
    </p>
  );
}
