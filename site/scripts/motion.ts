const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Calm mode stops each animation. The checkbox sets `data-motion` on the root
 * element, as the application does. Calm mode is always on when the operating
 * system asks for reduced motion.
 */
export function setupCalmMode(): void {
  const input = document.querySelector<HTMLInputElement>("#calm-mode");
  if (!input) return;
  const label = document.querySelector<HTMLElement>("[data-motion-label]");
  const system = window.matchMedia(REDUCED_MOTION);

  const apply = () => {
    const calm = system.matches || input.checked;
    document.documentElement.dataset.motion = calm ? "calm" : "full";
    if (label) label.textContent = calm ? "Calm" : "Full";
  };
  const followSystem = () => {
    input.disabled = system.matches;
    if (system.matches) input.checked = true;
    apply();
  };

  input.addEventListener("change", apply);
  system.addEventListener("change", followSystem);
  followSystem();
}
