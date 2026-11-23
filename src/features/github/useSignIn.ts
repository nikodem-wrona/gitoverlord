import { useEffect, useEffectEvent, useState } from "react";

import {
  type Account,
  commands,
  type DeviceCode,
  errorMessage,
  unwrap,
} from "@/ipc";

/** GitHub asks for 5 more seconds between polls when it sends `slowDown`. */
const SLOW_DOWN = 5_000;

export type SignInState =
  | { phase: "starting" }
  | { phase: "waiting"; code: DeviceCode }
  | { phase: "failed"; message: string };

/**
 * Runs the device flow while the component shows: it gets a code, then polls
 * GitHub until the user types the code. `onDone` gets the account.
 */
export function useSignIn(onDone: (account: Account) => void): SignInState {
  const [state, setState] = useState<SignInState>({ phase: "starting" });
  const done = useEffectEvent(onDone);

  useEffect(() => {
    const flow = { stopped: false, timer: 0 };
    const fail = (message: string) => {
      if (!flow.stopped) setState({ phase: "failed", message });
    };
    const poll = (code: DeviceCode, delay: number) => {
      flow.timer = window.setTimeout(() => {
        unwrap(commands.githubPollSignIn(code.deviceCode)).then(
          (step) => {
            if (flow.stopped) return;
            if (step.kind === "pending") poll(code, delay);
            else if (step.kind === "slowDown") poll(code, delay + SLOW_DOWN);
            else if (step.kind === "expired")
              fail("The code expired. Start again.");
            else if (step.kind === "denied")
              fail("GitHub did not give the access.");
            else done(step.account);
          },
          (error: unknown) => fail(errorMessage(error)),
        );
      }, delay);
    };
    unwrap(commands.githubStartSignIn()).then(
      (code) => {
        if (flow.stopped) return;
        setState({ phase: "waiting", code });
        poll(code, code.interval * 1000);
      },
      (error: unknown) => fail(errorMessage(error)),
    );
    return () => {
      flow.stopped = true;
      window.clearTimeout(flow.timer);
    };
  }, []);

  return state;
}
