import { Button } from "@/hud";

import { useOptions } from "./optionsContext";

/** Opens the options dialog. */
export function OptionsButton() {
  const { openOptions } = useOptions();
  return <Button onClick={openOptions}>Options</Button>;
}
