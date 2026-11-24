/** The themes, in the order of the theme menu. The first theme is the default. */
export const THEMES = [
  {
    id: "overlord",
    label: "Overlord",
    detail: "Black and grey with one green",
  },
  { id: "amber", label: "Amber", detail: "A warm amber terminal" },
  { id: "mono", label: "Mono", detail: "Black, white, and grey only" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "overlord";

export function isThemeId(value: string | null): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

/** The name of a theme for the user. */
export function themeLabel(id: ThemeId): string {
  return THEMES.find((theme) => theme.id === id)?.label ?? id;
}
