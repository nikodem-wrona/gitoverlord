import { describe, expect, it } from "vitest";

import { formatDay, formatTime, shortHash } from "./format";

describe("shortHash", () => {
  it("keeps the first seven characters", () => {
    expect(shortHash("0123456789abcdef")).toBe("0123456");
  });
});

describe("formatTime", () => {
  it("gives the date and the time with two digits for each part", () => {
    const seconds = new Date(2026, 0, 5, 9, 7).getTime() / 1000;

    expect(formatTime(seconds)).toBe("2026-01-05 09:07");
  });
});

describe("formatDay", () => {
  it("gives only the date", () => {
    const seconds = new Date(2026, 10, 23, 23, 59).getTime() / 1000;

    expect(formatDay(seconds)).toBe("2026-11-23");
  });
});
