import { describe, expect, it } from "vitest";

import { contrast, over, readTokens, tokenColor } from "@/test/contrast";

import themesCss from "../themes.css?raw";
import tokensCss from "../tokens.css?raw";
import { DEFAULT_THEME, THEMES } from "./themes";

/** WCAG AA: text needs 4.5:1, and the border of a control needs 3:1. */
const TEXT_RATIO = 4.5;
const CONTROL_RATIO = 3;

/** The tokens of text. Each one must be readable on each surface. */
const TEXT_TOKENS = [
  "--color-text",
  "--color-text-dim",
  "--color-text-faint",
  "--color-accent",
  "--color-active",
  "--color-ok",
  "--color-warn",
  "--color-fail",
];

/** The tokens of text in a selected row of a table. */
const ROW_TOKENS = ["--color-text", "--color-text-dim", "--color-fail"];

function themeTokens(id: string): Map<string, string> {
  const base = readTokens(tokensCss, ":root");
  if (id === DEFAULT_THEME) return base;
  const theme = readTokens(themesCss, `:root[data-theme="${id}"]`);
  return new Map([...base, ...theme]);
}

/** The colors of the surfaces under the text: the page, a panel, and a panel header. */
function surfaces(tokens: Map<string, string>) {
  const page = tokenColor(tokens, "--color-bg");
  const panel = over(tokenColor(tokens, "--color-panel"), page);
  return {
    page,
    panel,
    header: over(tokenColor(tokens, "--color-panel-header"), page),
    selectedRow: over(tokenColor(tokens, "--color-row-selected"), panel),
  };
}

function ratios(tokens: Map<string, string>, names: string[], surface: string) {
  const back = surfaces(tokens)[surface as keyof ReturnType<typeof surfaces>];
  return names.map((name) => ({
    name,
    ratio: Number(contrast(tokenColor(tokens, name), back).toFixed(2)),
  }));
}

describe.each(THEMES.map((theme) => [theme.label, theme.id]))(
  "the %s theme",
  (_label, id) => {
    const tokens = themeTokens(id);

    it.each(["page", "panel", "header"])(
      "has readable text on the %s",
      (surface) => {
        const low = ratios(tokens, TEXT_TOKENS, surface).filter(
          (item) => item.ratio < TEXT_RATIO,
        );
        expect(low).toEqual([]);
      },
    );

    it("has readable text in a selected row", () => {
      const low = ratios(tokens, ROW_TOKENS, "selectedRow").filter(
        (item) => item.ratio < TEXT_RATIO,
      );
      expect(low).toEqual([]);
    });

    it("has visible borders on the controls", () => {
      const low = ["page", "panel"]
        .flatMap((surface) => ratios(tokens, ["--color-control-line"], surface))
        .filter((item) => item.ratio < CONTROL_RATIO);
      expect(low).toEqual([]);
    });
  },
);
