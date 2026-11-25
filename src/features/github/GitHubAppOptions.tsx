import { useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";

import { useActions } from "@/actions";
import { Button, TextField } from "@/hud";
import type { GitHubApp } from "@/ipc";

import { appDescription, isClientId, saveClientIdAction } from "./clientId";
import styles from "./GitHub.module.css";
import { useGitHubApp } from "./queries";

/** The options section of the GitHub app of the sign-in. */
export function GitHubAppOptions({ onSaved }: { onSaved(): void }) {
  const titleId = useId();
  const app = useGitHubApp().data;

  return (
    <section className={styles.options} aria-labelledby={titleId}>
      <h3 id={titleId} className={styles.heading}>
        GitHub app
      </h3>
      <p className={styles.text}>
        To sign in with your own OAuth app or GitHub App, turn on the device
        flow in its settings and turn off the expiry of user tokens. Then paste
        its client ID here. Leave the field empty to use the built-in app.
      </p>
      {app && <ClientIdForm app={app} onSaved={onSaved} />}
    </section>
  );
}

function ClientIdForm({ app, onSaved }: { app: GitHubApp; onSaved(): void }) {
  const [text, setText] = useState(app.saved ?? "");
  const client = useQueryClient();
  const { run } = useActions();
  const valid = isClientId(text);
  const save = (value: string) => {
    if (!isClientId(value)) return;
    run(saveClientIdAction(client, value));
    onSaved();
  };

  return (
    <>
      <TextField
        label="Client ID"
        value={text}
        onChange={setText}
        placeholder="Built-in app"
        onKeyDown={(event) => event.key === "Enter" && save(text)}
      />
      {!valid && (
        <p className={styles.failure} data-tone="fail" role="alert">
          A client ID has only letters, digits, and dots.
        </p>
      )}
      <p
        className={styles.text}
        data-tone={app.source === "environment" ? "warn" : undefined}
      >
        {appDescription(app)}
      </p>
      <div className={styles.buttons}>
        {app.saved !== null && (
          <Button onClick={() => save("")}>Use the built-in app</Button>
        )}
        <Button variant="primary" disabled={!valid} onClick={() => save(text)}>
          Save
        </Button>
      </div>
    </>
  );
}
