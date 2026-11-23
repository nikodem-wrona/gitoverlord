import { useEffect, useState } from "react";

import { GitReadout } from "@/features/system";
import { useMotion } from "@/hud";

import styles from "./StatusBar.module.css";

/** The bottom line: git status, data source, motion mode, and the time. */
export function StatusBar() {
  const { calm } = useMotion();

  return (
    <footer className={styles.bar}>
      <GitReadout />
      <span data-tone="fail" className={styles.toned}>
        Demo data
      </span>
      <span>Motion: {calm ? "calm" : "full"}</span>
      <span className={styles.spacer} />
      <span>Phase 1 · HUD kit</span>
      <Clock />
    </footer>
  );
}

function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <time className={styles.clock} dateTime={now.toISOString()}>
      {now.toLocaleTimeString("en-GB", { hour12: false })}
    </time>
  );
}
