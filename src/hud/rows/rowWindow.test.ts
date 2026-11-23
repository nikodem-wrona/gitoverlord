import { describe, expect, it } from "vitest";

import { computeRowWindow, scrollTopFor } from "./rowWindow";

const VIEW = { scrollTop: 0, viewportHeight: 200, rowHeight: 20 };

describe("computeRowWindow", () => {
  it("renders the rows in the viewport and some rows after them", () => {
    const window = computeRowWindow(1000, VIEW);

    expect(window.start).toBe(0);
    expect(window.end).toBe(18);
    expect(window.before).toBe(0);
    expect(window.after).toBe((1000 - 18) * 20);
  });

  it("moves with the scroll position", () => {
    const window = computeRowWindow(1000, { ...VIEW, scrollTop: 2000 });

    expect(window.start).toBe(92);
    expect(window.end).toBe(118);
    expect(window.before).toBe(92 * 20);
  });

  it("stops at the last row", () => {
    const window = computeRowWindow(105, { ...VIEW, scrollTop: 1900 });

    expect(window.end).toBe(105);
    expect(window.after).toBe(0);
  });

  it("keeps the full height in the spacers", () => {
    const { start, end, before, after } = computeRowWindow(500, {
      ...VIEW,
      scrollTop: 3210,
    });

    expect(before + (end - start) * 20 + after).toBe(500 * 20);
  });

  it("renders the first rows when the sizes are not known", () => {
    const unmeasured = { scrollTop: 0, viewportHeight: 0, rowHeight: 0 };

    expect(computeRowWindow(10, unmeasured)).toEqual({
      start: 0,
      end: 10,
      before: 0,
      after: 0,
    });
    expect(computeRowWindow(1000, unmeasured).end).toBe(60);
  });
});

describe("scrollTopFor", () => {
  it("does not scroll when the row is in view", () => {
    expect(scrollTopFor(3, VIEW)).toBeUndefined();
  });

  it("scrolls up to a row above the viewport", () => {
    expect(scrollTopFor(2, { ...VIEW, scrollTop: 100 })).toBe(40);
  });

  it("scrolls down to a row below the viewport, under the header", () => {
    expect(scrollTopFor(20, VIEW, 24)).toBe(21 * 20 + 24 - 200);
  });
});
