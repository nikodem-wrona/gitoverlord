import type { Repository } from "@/features/repository";
import {
  Button,
  CalmToggle,
  DecodeText,
  LogoMark,
  Readout,
  useToast,
} from "@/hud";

import styles from "./TopBar.module.css";

/** The brand, the repository readouts, the sync commands, and calm mode. */
export function TopBar({ repository }: { repository: Repository }) {
  const toast = useToast();
  const syncOffline = () =>
    toast.info("Sync is offline", "Fetch, pull, and push arrive in phase 4.");

  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <LogoMark size="1.75rem" />
        <span className={styles.name}>
          <DecodeText text="gitoverlord" duration={900} />
        </span>
      </div>
      <dl className={styles.readouts}>
        <Readout label="Repository" value={repository.name} />
        <Readout label="Branch" value={repository.head} />
        <Readout
          label="Sync"
          value={`↑${repository.ahead}  ↓${repository.behind}`}
        />
      </dl>
      <div className={styles.actions}>
        <Button onClick={syncOffline}>Fetch</Button>
        <Button onClick={syncOffline}>Pull</Button>
        <Button variant="primary" onClick={syncOffline}>
          Push
        </Button>
        <CalmToggle />
      </div>
    </header>
  );
}
