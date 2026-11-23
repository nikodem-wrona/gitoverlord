import { useEffect } from "react";

import { useGitStatus } from "@/features/system";
import { DecodeText, LogoMark, StatusLine } from "@/hud";

import styles from "./BootScreen.module.css";
import { bootSteps } from "./bootSteps";
import { useBootSequence } from "./useBootSequence";

interface BootScreenProps {
  /** Called when the sequence ends or the user skips it. Keep the same identity. */
  onFinish(): void;
}

/** The start-up sequence. Any key or click skips it. */
export function BootScreen({ onFinish }: BootScreenProps) {
  const steps = bootSteps(useGitStatus());
  const visible = useBootSequence(steps.length, onFinish);
  useSkip(onFinish);

  return (
    <div className={styles.boot}>
      <LogoMark size="6rem" />
      <h1 className={styles.title}>
        <DecodeText text="gitoverlord" duration={900} />
      </h1>
      <p className={styles.subtitle}>Repository command console</p>
      <ol className={styles.steps} aria-label="Start-up checks">
        {steps.slice(0, visible).map((step) => (
          <li key={step.label} className={styles.step}>
            <StatusLine
              label={step.label}
              state={step.state}
              value={step.value}
            />
          </li>
        ))}
      </ol>
      <p className={styles.hint}>Press any key to skip</p>
    </div>
  );
}

function useSkip(onSkip: () => void): void {
  useEffect(() => {
    window.addEventListener("keydown", onSkip);
    window.addEventListener("pointerdown", onSkip);
    return () => {
      window.removeEventListener("keydown", onSkip);
      window.removeEventListener("pointerdown", onSkip);
    };
  }, [onSkip]);
}
