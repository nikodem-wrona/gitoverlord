/**
 * The theme buttons set `data-theme` on the root element, as the application
 * does. The page has the themes of the application, so the buttons show them.
 */
export function setupThemes(): void {
  const options = [
    ...document.querySelectorAll<HTMLButtonElement>("[data-theme-option]"),
  ];
  const cycle = document.querySelector<HTMLElement>("[data-theme-cycle]");

  for (const option of options) {
    option.addEventListener("click", () => applyTheme(options, option));
  }
  // The status bar button selects the next theme.
  cycle?.addEventListener("click", () => {
    const current = options.findIndex(
      (option) => option.getAttribute("aria-pressed") === "true",
    );
    const next = options[(current + 1) % options.length];
    if (next) applyTheme(options, next);
  });
}

function applyTheme(
  options: HTMLButtonElement[],
  selected: HTMLButtonElement,
): void {
  const id = selected.dataset.themeOption ?? "";
  document.documentElement.dataset.theme = id;
  for (const option of options) {
    option.setAttribute("aria-pressed", String(option === selected));
  }
  // The screenshot of the History tab has one image for each theme.
  for (const shot of document.querySelectorAll<HTMLElement>(
    "[data-theme-shot]",
  )) {
    shot.hidden = shot.dataset.themeShot !== id;
  }
  const label = document.querySelector<HTMLElement>("[data-theme-label]");
  const name = selected.querySelector(".theme-name")?.textContent;
  if (label && name) label.textContent = name;
}
