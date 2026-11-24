import axe from "axe-core";
import { expect, vi } from "vitest";

/**
 * jsdom has no layout, so axe cannot compute the colors of the text. The
 * contrast test of the themes checks the color tokens.
 */
const RULES = { "color-contrast": { enabled: false } };

// A pop-up menu is in a portal at the end of the page. It needs no landmark.
axe.configure({
  rules: [
    { id: "region", selector: "body *:not([role='menu'], [role='menu'] *)" },
  ],
});

/** Checks the page with the WCAG 2.1 AA rules of axe. The test fails with each violation. */
export async function expectAccessible(
  root: Element = document.body,
): Promise<void> {
  // axe draws text on a canvas to find icon fonts. jsdom has no canvas, and
  // the application has no icon fonts.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  const results = await axe.run(root, {
    rules: RULES,
    resultTypes: ["violations"],
  });
  const violations = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help}\n${violation.nodes
        .map((node) => `  ${node.target.join(" ")}`)
        .join("\n")}`,
  );
  expect(violations).toEqual([]);
}
