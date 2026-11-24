import { type ReactNode, useLayoutEffect, useMemo, useState } from "react";

import { readSetting, writeSetting } from "../settings";
import { type Theme, ThemeContext } from "./themeContext";
import { DEFAULT_THEME, isThemeId, type ThemeId } from "./themes";

const THEME_KEY = "gitoverlord.theme";

function readTheme(): ThemeId {
  const stored = readSetting(THEME_KEY);
  return isThemeId(stored) ? stored : DEFAULT_THEME;
}

/**
 * Holds the theme of the user and sets `data-theme` on the root element.
 *
 * `themes.css` gives each theme its colors. The setting stays for the next start.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState(readTheme);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value = useMemo<Theme>(
    () => ({
      theme,
      setTheme: (next) => {
        writeSetting(THEME_KEY, next);
        setThemeState(next);
      },
    }),
    [theme],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
