import { type MouseEvent, useCallback, useState } from "react";

import { Menu, type MenuPoint } from "../Menu";
import { StatusButton } from "../StatusButton";
import { useTheme } from "./themeContext";
import { isThemeId, themeLabel, THEMES } from "./themes";

/** The theme in the status bar. A click opens the list of the themes above it. */
export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [at, setAt] = useState<MenuPoint | null>(null);
  const close = useCallback(() => setAt(null), []);
  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setAt((open) => (open ? null : { x: box.left, y: box.top - 2 }));
  };
  const items = THEMES.map((item) => ({
    id: item.id,
    label: `${item.label}: ${item.detail}`,
    checked: item.id === theme,
  }));

  return (
    <>
      <StatusButton
        aria-haspopup="menu"
        aria-expanded={at !== null}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={toggle}
      >
        Theme: {themeLabel(theme)}
      </StatusButton>
      {at && (
        <Menu
          label="Themes"
          items={items}
          at={at}
          above
          onSelect={(id) => {
            if (isThemeId(id)) setTheme(id);
            close();
          }}
          onClose={close}
        />
      )}
    </>
  );
}
