import { useEffect, useState } from "react";

import { ActionStatus } from "@/actions";
import { GitReadout } from "@/features/system";
import { SoundToggle, ThemePicker, useMotion } from "@/hud";
import { isDemoBackend } from "@/ipc";

import styles from "./StatusBar.module.css";

/** The bottom line: git status, data source, motion mode, and the time. */
export function StatusBar() {
  const { calm } = useMotion();
  const demo = isDemoBackend();

  return (
    <footer className={styles.bar}>
      <GitReadout />
      <span data-tone={demo ? "fail" : "ok"} className={styles.toned}>
        {demo ? "Demo data" : "Live data"}
      </span>
      <span>Motion: {calm ? "calm" : "full"}</span>
      <ThemePicker />
      <SoundToggle />
      <ActionStatus />
      <span className={styles.spacer} />
      <span>Phase 7 · Showpieces</span>
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
