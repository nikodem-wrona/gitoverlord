import { useQueryClient } from "@tanstack/react-query";

import { Button, DecodeText, Dialog, useToast } from "@/hud";
import { type Account, commands, type DeviceCode } from "@/ipc";

import styles from "./GitHub.module.css";
import { githubKeys } from "./queries";
import { type SignInState, useSignIn } from "./useSignIn";

/** The device flow: the user types the code on GitHub, and the dialog waits for the token. */
export function SignInDialog({ onClose }: { onClose(): void }) {
  const client = useQueryClient();
  const toast = useToast();
  const state = useSignIn((account: Account) => {
    client.setQueryData(githubKeys.account, account);
    void client.invalidateQueries({ queryKey: githubKeys.all });
    toast.ok("Signed in to GitHub", `@${account.login}`);
    onClose();
  });

  return (
    <Dialog
      title="Sign in to GitHub"
      onClose={onClose}
      footer={<Footer state={state} onClose={onClose} />}
    >
      <SignInBody state={state} />
    </Dialog>
  );
}

function SignInBody({ state }: { state: SignInState }) {
  if (state.phase === "starting") {
    return <p className={styles.text}>GitHub sends a code.</p>;
  }
  if (state.phase === "failed") {
    return (
      <p className={styles.failure} data-tone="fail" role="alert">
        {state.message}
      </p>
    );
  }
  return (
    <>
      <p className={styles.text}>Type this code on the GitHub page:</p>
      <DecodeText
        text={state.code.userCode}
        duration={700}
        className={styles.code}
      />
      <p className={styles.text}>
        The sign-in completes here when GitHub accepts the code. The token stays
        in the keychain of your system.
      </p>
    </>
  );
}

function Footer({ state, onClose }: { state: SignInState; onClose(): void }) {
  return (
    <>
      <Button onClick={onClose}>
        {state.phase === "failed" ? "Close" : "Cancel"}
      </Button>
      {state.phase === "waiting" && (
        <Button variant="primary" onClick={() => openCodePage(state.code)}>
          Copy the code and open GitHub
        </Button>
      )}
    </>
  );
}

/** The clipboard can refuse the code. The user can still type it from the dialog. */
function openCodePage(code: DeviceCode) {
  void navigator.clipboard?.writeText(code.userCode).catch(() => {});
  void commands.openGithubPage(code.verificationUri);
}
