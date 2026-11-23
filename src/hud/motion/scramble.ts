const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+<>/=";

/**
 * Shows the start of `text` and replaces the remainder with random glyphs.
 *
 * `progress` goes from 0 (all glyphs) to 1 (all text). Spaces stay spaces.
 */
export function scramble(
  text: string,
  progress: number,
  random: () => number = Math.random,
): string {
  const characters = Array.from(text);
  const clamped = Math.min(Math.max(progress, 0), 1);
  const revealed = Math.floor(characters.length * clamped);

  return characters
    .map((character, index) =>
      index < revealed || character === " " ? character : glyph(random),
    )
    .join("");
}

function glyph(random: () => number): string {
  return GLYPHS.charAt(Math.floor(random() * GLYPHS.length));
}
