import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useSound } from "./soundContext";
import { SoundProvider } from "./SoundProvider";
import { CUES } from "./sounds";
import { SoundToggle } from "./SoundToggle";

/** A Web Audio context that counts the tones. */
function stubAudio() {
  const tones = vi.fn<(frequency: number) => void>();
  const node = () => ({
    connect: (target: unknown) => target,
    gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
  });
  class FakeAudioContext {
    state = "running";
    currentTime = 0;
    destination = {};
    createGain = node;
    createOscillator() {
      const oscillator = {
        ...node(),
        type: "sine",
        frequency: { value: 0 },
        start: () => tones(oscillator.frequency.value),
        stop: () => {},
      };
      return oscillator;
    }
  }
  vi.stubGlobal("AudioContext", FakeAudioContext);
  return tones;
}

function FailButton() {
  const { play } = useSound();
  return (
    <button type="button" onClick={() => play("fail")}>
      Fail
    </button>
  );
}

function renderSound() {
  render(
    <SoundProvider>
      <SoundToggle />
      <FailButton />
    </SoundProvider>,
  );
}

describe("SoundProvider", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("plays no sound until the user turns it on", () => {
    const tones = stubAudio();
    renderSound();

    fireEvent.click(screen.getByRole("button", { name: "Fail" }));

    expect(tones).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Sound: off" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("plays the sound of each result after the user turns it on", () => {
    const tones = stubAudio();
    renderSound();

    fireEvent.click(screen.getByRole("button", { name: "Sound: off" }));
    fireEvent.click(screen.getByRole("button", { name: "Fail" }));

    const played = tones.mock.calls.map(([frequency]) => frequency);
    const expected = [...CUES.ok.notes, ...CUES.fail.notes];
    expect(played).toEqual(expected.map((note) => note.frequency));
    expect(localStorage.getItem("gitoverlord.sound")).toBe("on");
  });
});
