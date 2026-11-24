import { createContext, useContext } from "react";

import { DEFAULT_THEME, type ThemeId } from "./themes";

export interface Theme {
  theme: ThemeId;
  setTheme(theme: ThemeId): void;
}

// Without a ThemeProvider, the default theme applies.
export const ThemeContext = createContext<Theme>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

/** Gives the theme of the user and a function that changes it. */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}
