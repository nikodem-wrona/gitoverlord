import { useEffect, useState } from "react";

import { useMotion } from "./motionContext";
import { scramble } from "./scramble";

/**
 * Returns `text` as it decodes from random glyphs over `duration` milliseconds.
 *
 * In calm mode, the text is shown immediately.
 */
export function useDecodedText(text: string, duration: number): string {
  const { calm } = useMotion();
  const [shown, setShown] = useState(() => (calm ? text : scramble(text, 0)));

  useEffect(() => {
    if (calm) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = (now - start) / duration;
      setShown(progress >= 1 ? text : scramble(text, progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text, duration, calm]);

  return calm ? text : shown;
}
