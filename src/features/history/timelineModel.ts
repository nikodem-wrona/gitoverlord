import type { Tone } from "@/hud";

/** The distance between two commits on the timeline, in pixels. */
export const COMMIT_STEP = 34;

export interface TimelineSize {
  width: number;
  height: number;
}

/** One commit on the timeline. All positions are in pixels. */
export interface TimelineNode {
  hash: string;
  subject: string;
  x: number;
  y: number;
  tone: Tone;
  head: boolean;
  merge: boolean;
}

/** A line from a parent to its child, or from a commit to the edge of the view. */
export interface TimelineLink {
  id: string;
  /** The `d` attribute of an SVG path. */
  path: string;
  tone: Tone;
}

/** The name of a branch or tag above its commit. */
export interface TimelineLabel {
  hash: string;
  text: string;
  x: number;
  y: number;
  tone: Tone;
  anchor: "start" | "end";
}

/** The start of a day on the time axis. A mark without text has no space for its date. */
export interface DayMark {
  x: number;
  text: string;
}

export interface TimelineLayout {
  nodes: TimelineNode[];
  links: TimelineLink[];
  labels: TimelineLabel[];
  days: DayMark[];
  /** The vertical position of the time axis. */
  axisY: number;
}
