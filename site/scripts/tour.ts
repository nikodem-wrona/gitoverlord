const MOVES: Record<string, (index: number, count: number) => number> = {
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (_index, count) => count - 1,
};

/**
 * Changes the screens of the tour into tabs. Without this script, the page
 * shows the screens one after the other.
 */
export function setupTour(): void {
  const tour = document.querySelector<HTMLElement>("[data-tour]");
  if (!tour) return;
  const screens = [...tour.querySelectorAll<HTMLElement>("[data-screen]")];
  const list = document.createElement("div");
  list.className = "tabs";
  list.setAttribute("role", "tablist");
  list.setAttribute("aria-label", "Screens");

  const tabs = screens.map((screen) => createTab(screen));
  const select = (index: number, focus = false) => {
    tabs.forEach((tab, at) => {
      tab.setAttribute("aria-selected", String(at === index));
      tab.tabIndex = at === index ? 0 : -1;
    });
    screens.forEach((screen, at) => (screen.hidden = at !== index));
    if (focus) tabs[index]?.focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(index));
    tab.addEventListener("keydown", (event) => {
      const move = MOVES[event.key];
      if (!move) return;
      event.preventDefault();
      select(move(index, tabs.length), true);
    });
  });
  list.append(...tabs);
  tour.prepend(list);
  tour.dataset.ready = "";
  select(0);
}

/** Makes the tab of a screen, and gives the screen the role of its panel. */
function createTab(screen: HTMLElement): HTMLButtonElement {
  const tab = document.createElement("button");
  tab.type = "button";
  tab.className = "tab";
  tab.id = `tab-${screen.id}`;
  tab.textContent = screen.dataset.screen ?? "";
  tab.setAttribute("role", "tab");
  tab.setAttribute("aria-controls", screen.id);
  screen.setAttribute("role", "tabpanel");
  screen.setAttribute("aria-labelledby", tab.id);
  screen.tabIndex = 0;
  return tab;
}
