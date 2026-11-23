import { createContext, useContext } from "react";

export interface Motion {
  /** True when animations must stop: the user or the system asks for calm. */
  calm: boolean;
  /** The calm mode setting of the user. */
  calmSetting: boolean;
  /** True when the operating system asks for reduced motion. */
  systemCalm: boolean;
  setCalmSetting(calm: boolean): void;
}

// Without a MotionProvider, nothing moves.
export const MotionContext = createContext<Motion>({
  calm: true,
  calmSetting: false,
  systemCalm: false,
  setCalmSetting: () => {},
});

/** Tells if animations can run. */
export function useMotion(): Motion {
  return useContext(MotionContext);
}
