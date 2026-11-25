import { createContext, useContext } from "react";

/** Opens the options dialog. */
export interface OptionsApi {
  openOptions(): void;
}

export const OptionsContext = createContext<OptionsApi | null>(null);

export function useOptions(): OptionsApi {
  const api = useContext(OptionsContext);
  if (!api) throw new Error("useOptions must be inside OptionsProvider.");
  return api;
}
