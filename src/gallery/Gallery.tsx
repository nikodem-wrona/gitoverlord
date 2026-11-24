import { CalmToggle, LogoMark } from "@/hud";

import { ControlsSection } from "./ControlsSection";
import { DataSection } from "./DataSection";
import { FeedbackSection } from "./FeedbackSection";
import { FormsSection } from "./FormsSection";
import styles from "./Gallery.module.css";
import { MotionSection } from "./MotionSection";

/** Shows each HUD primitive with its variants. */
export function Gallery() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <LogoMark size="2rem" />
        <h1 className={styles.title}>HUD kit gallery</h1>
        <CalmToggle />
      </header>
      <div className={styles.grid}>
        <ControlsSection />
        <FormsSection />
        <DataSection />
        <MotionSection />
        <FeedbackSection />
      </div>
    </div>
  );
}
