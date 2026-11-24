import { setupCopyButtons } from "./copy";
import { setupCalmMode } from "./motion";
import { setupSectionNav } from "./sectionNav";
import { setupThemes } from "./theme";
import { setupTour } from "./tour";

/** Starts each script of the page. A control that needs a script is hidden until now. */
export function startPage(): void {
  for (const control of document.querySelectorAll<HTMLElement>(
    "[data-needs-script]",
  )) {
    control.hidden = false;
  }
  setupCalmMode();
  setupThemes();
  setupTour();
  setupSectionNav();
  setupCopyButtons();
}
