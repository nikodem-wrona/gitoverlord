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
      void copyText(source?.textContent ?? "").then((copied) => {
        button.textContent = copied ? "Copied" : "Copy failed";
        window.setTimeout(() => (button.textContent = label), RESULT_TIME);
      });
    });
  }
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
