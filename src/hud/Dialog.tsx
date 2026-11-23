import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useRef,
} from "react";

import styles from "./Dialog.module.css";

interface DialogProps {
  title: string;
  /** Runs on the Escape key and on a click outside the dialog. */
  onClose(): void;
  children: ReactNode;
  /** The buttons at the bottom. */
  footer?: ReactNode;
}

/**
 * A modal window over the application.
 *
 * The first field or button gets the focus. When the dialog closes, the focus
 * goes back to the element that had it before.
 */
export function Dialog({ title, onClose, children, footer }: DialogProps) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  useFocusInside(ref);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    // The Escape key must not also close the panel under the dialog.
    event.stopPropagation();
    onClose();
  };
  const onBackdrop = (event: MouseEvent) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className={styles.backdrop} onMouseDown={onBackdrop}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.dialog}
        onKeyDown={onKeyDown}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}

const FOCUSABLE = "input, textarea, button:not(:disabled), [tabindex='0']";

function useFocusInside(ref: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    const before = document.activeElement;
    ref.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => {
      if (before instanceof HTMLElement) before.focus();
    };
  }, [ref]);
}
