import { type ReactNode, useMemo, useState } from "react";

import { defineAction, useRegisterActions } from "@/actions";

import { type OptionsApi, OptionsContext } from "./optionsContext";
import { OptionsDialog } from "./OptionsDialog";

/** Holds the options dialog, and puts **Options…** in the command palette. */
export function OptionsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const api = useMemo<OptionsApi>(
    () => ({ openOptions: () => setOpen(true) }),
    [],
  );
  useRegisterActions([
    defineAction({
      id: "app.options",
      label: "Options…",
      group: "Application",
      shortcut: "Mod+,",
      run: api.openOptions,
    }),
  ]);

  return (
    <OptionsContext value={api}>
      {children}
      {open && <OptionsDialog onClose={() => setOpen(false)} />}
    </OptionsContext>
  );
}
