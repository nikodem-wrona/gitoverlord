// The time that the button shows the result of the copy, in milliseconds.
const RESULT_TIME = 2000;

/** A button with `data-copy` copies the text of the element that the attribute selects. */
export function setupCopyButtons(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "[data-copy]",
  )) {
    const label = button.textContent;
    button.addEventListener("click", () => {
      const source = document.querySelector(button.dataset.copy ?? "");
      void copyText(commandText(source)).then((copied) => {
        button.textContent = copied ? "Copied" : "Copy failed";
        window.setTimeout(() => (button.textContent = label), RESULT_TIME);
      });
    });
  }
}

/**
 * The commands of a terminal block, one for each line. Each command is in an
 * element with `data-line`. The line breaks of the page source are not part of
 * a command.
 */
function commandText(source: Element | null): string {
  if (!source) return "";
  const lines = [...source.querySelectorAll("[data-line]")];
  return (lines.length > 0 ? lines : [source])
    .map((line) => (line.textContent ?? "").replace(/\s+/g, " ").trim())
    .join("\n");
}

/** Gives false when the browser refuses the access to the clipboard. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
