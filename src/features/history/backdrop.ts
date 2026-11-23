import { createRandom } from "@/hud";

import { MAP_HEIGHT, MAP_WIDTH } from "./layoutStarMap";

const GRID_STEP_X = 100;
const GRID_STEP_Y = 60;

export interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
}

/** Makes the background stars. The same seed gives the same stars. */
export function makeStars(count: number, seed: number): Star[] {
  const random = createRandom(seed);
  return Array.from({ length: count }, () => ({
    x: random() * MAP_WIDTH,
    y: random() * MAP_HEIGHT,
    r: 0.4 + random() * 1.1,
    opacity: 0.15 + random() * 0.55,
  }));
}

/** Makes one SVG path for the grid lines of the map. */
export function gridPath(): string {
  const columns = Math.floor(MAP_WIDTH / GRID_STEP_X);
  const rows = Math.floor(MAP_HEIGHT / GRID_STEP_Y);
  const vertical = Array.from(
    { length: columns - 1 },
    (_, index) => `M${(index + 1) * GRID_STEP_X} 0V${MAP_HEIGHT}`,
  );
  const horizontal = Array.from(
    { length: rows - 1 },
    (_, index) => `M0 ${(index + 1) * GRID_STEP_Y}H${MAP_WIDTH}`,
  );
  return [...vertical, ...horizontal].join(" ");
}
