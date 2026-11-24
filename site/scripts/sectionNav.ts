// A section is the current one when its top is above this part of the window height.
const CURRENT_LINE = 1 / 3;

/** Marks the tab of the section that the window shows, as the tabs of the application do. */
export function setupSectionNav(): void {
  const nav = document.querySelector<HTMLElement>(".section-nav");
  if (!nav) return;
  const links = [...nav.querySelectorAll<HTMLAnchorElement>("a")];
  let marked: HTMLAnchorElement | undefined;

  const update = () => {
    const current = currentLink(links);
    if (!current || current === marked) return;
    marked?.removeAttribute("aria-current");
    current.setAttribute("aria-current", "location");
    marked = current;
    // On a narrow screen, the tabs scroll. Keep the current tab in view.
    nav.scrollLeft =
      current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2;
  };
  for (const link of links) link.removeAttribute("aria-current");
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

/** The last link whose section starts above the line. At the end of the page, the last link. */
function currentLink(
  links: HTMLAnchorElement[],
): HTMLAnchorElement | undefined {
  const page = document.documentElement;
  const atEnd = window.innerHeight + window.scrollY >= page.scrollHeight - 1;
  if (atEnd && window.scrollY > 0) return links.at(-1);
  const line = window.innerHeight * CURRENT_LINE;
  const started = links.filter((link) => {
    const section = document.querySelector(link.hash);
    return section !== null && section.getBoundingClientRect().top <= line;
  });
  return started.at(-1) ?? links[0];
}
