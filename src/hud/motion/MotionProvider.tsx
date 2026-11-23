import {
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { type Motion, MotionContext } from "./motionContext";
import {
  readCalmSetting,
  subscribeReducedMotion,
  systemPrefersReducedMotion,
  writeCalmSetting,
} from "./motionPreference";

/**
 * Decides if animations run, and sets `data-motion` on the root element.
 *
 * Calm mode applies when the user selects it or when the system asks for reduced motion.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const systemCalm = useSyncExternalStore(
    subscribeReducedMotion,
    systemPrefersReducedMotion,
  );
  const [calmSetting, setSetting] = useState(readCalmSetting);
  const calm = systemCalm || calmSetting;

  useLayoutEffect(() => {
    document.documentElement.dataset.motion = calm ? "calm" : "full";
  }, [calm]);

  const value = useMemo<Motion>(
    () => ({
      calm,
      calmSetting,
      systemCalm,
      setCalmSetting: (next) => {
        writeCalmSetting(next);
        setSetting(next);
      },
    }),
    [calm, calmSetting, systemCalm],
  );

  return <MotionContext value={value}>{children}</MotionContext>;
}
