/** Reads the color tokens of a CSS file and computes WCAG contrast ratios. */

export interface Color {
  r: number;
  g: number;
  b: number;
  /** The opacity, from 0 to 1. */
  a: number;
}

/** Reads the custom properties of the rule with the selector `selector`. */
export function readTokens(css: string, selector: string): Map<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`No rule for ${selector}`);
  const block = css.slice(start, css.indexOf("}", start));
  const tokens = new Map<string, string>();
  for (const match of block.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    tokens.set(match[1] ?? "", (match[2] ?? "").trim());
  }
  return tokens;
}

/** Reads the color of `name`, and follows each `var()` reference. */
export function tokenColor(tokens: Map<string, string>, name: string): Color {
  const value = tokens.get(name);
  if (value === undefined) throw new Error(`No token ${name}`);
  const reference = /^var\((--[\w-]+)\)$/.exec(value);
  return reference?.[1] ? tokenColor(tokens, reference[1]) : parseColor(value);
}

function parseColor(value: string): Color {
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value)?.[1];
  if (hex) {
    const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
    return { r: r ?? 0, g: g ?? 0, b: b ?? 0, a: 1 };
  }
  const rgb = /^rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+)%)?\)$/.exec(value);
  if (!rgb) throw new Error(`Unknown color ${value}`);
  const [, r, g, b, alpha] = rgb;
  return {
    r: Number(r),
    g: Number(g),
    b: Number(b),
    a: alpha ? Number(alpha) / 100 : 1,
  };
}

/** The color of `top` painted on the opaque color `bottom`. */
export function over(top: Color, bottom: Color): Color {
  const mix = (front: number, back: number) =>
    front * top.a + back * (1 - top.a);
  return {
    r: mix(top.r, bottom.r),
    g: mix(top.g, bottom.g),
    b: mix(top.b, bottom.b),
    a: 1,
  };
}

/** The WCAG contrast ratio of two opaque colors, from 1 to 21. */
export function contrast(first: Color, second: Color): number {
  const [light, dark] = [luminance(first), luminance(second)].sort(
    (x, y) => y - x,
  );
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

function luminance({ r, g, b }: Color): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.039_28 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
