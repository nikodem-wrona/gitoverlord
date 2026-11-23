/**
 * Replaces `window.matchMedia`, which jsdom does not have.
 *
 * `reduced` is the answer to the reduced-motion query. The test setup sets it to true,
 * so tests run in calm mode unless a test turns motion on.
 */
export function mockReducedMotion(reduced: boolean): void {
  window.matchMedia = (query: string) =>
    ({
      matches: reduced && query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
