import { Button } from "@/hud";

import { useGitHub } from "./githubContext";

/** Opens the list of the GitHub repositories of the user. */
export function CloneFromGitHubButton() {
  const { openClone } = useGitHub();
  return <Button onClick={openClone}>Clone from GitHub</Button>;
}
