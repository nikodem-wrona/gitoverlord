import { useCallback, useState } from "react";

import { Button, Dialog, TextField } from "@/hud";

import styles from "./CommandPalette.module.css";
import { filterTexts } from "./paletteFilter";
import { PickList } from "./PickList";
import type { Action, Choice, Confirmation, Prompt } from "./types";

interface ActionDialogProps {
  action: Action;
  /** Runs the action. `text` is the answer, or an empty string. */
  onAnswer(text: string): void;
  onCancel(): void;
}

/** Asks the question of an action: a confirmation, a text, or a choice. */
export function ActionDialog({
  action,
  onAnswer,
  onCancel,
}: ActionDialogProps) {
  if (action.prompt) {
    return (
      <PromptDialog
        prompt={action.prompt}
        onSubmit={onAnswer}
        onCancel={onCancel}
      />
    );
  }
  if (action.choose) {
    return (
      <ChoiceDialog
        choice={action.choose}
        onPick={onAnswer}
        onCancel={onCancel}
      />
    );
  }
  if (action.confirm) {
    return (
      <ConfirmDialog
        confirmation={action.confirm}
        onConfirm={() => onAnswer("")}
        onCancel={onCancel}
      />
    );
  }
  return null;
}

interface ConfirmDialogProps {
  confirmation: Confirmation;
  onConfirm(): void;
  onCancel(): void;
}

/** The Cancel button gets the focus, so the Enter key does not destroy data. */
function ConfirmDialog({
  confirmation,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const footer = (
    <>
      <Button onClick={onCancel}>Cancel</Button>
      <Button variant="danger" onClick={onConfirm}>
        {confirmation.confirm}
      </Button>
    </>
  );
  return (
    <Dialog title={confirmation.title} onClose={onCancel} footer={footer}>
      <p>{confirmation.message}</p>
    </Dialog>
  );
}

interface PromptDialogProps {
  prompt: Prompt;
  onSubmit(text: string): void;
  onCancel(): void;
}

function PromptDialog({ prompt, onSubmit, onCancel }: PromptDialogProps) {
  const [text, setText] = useState(prompt.initial ?? "");
  const ready = prompt.optional === true || text.trim() !== "";
  const submit = () => {
    if (ready) onSubmit(text.trim());
  };
  const footer = (
    <>
      <Button onClick={onCancel}>Cancel</Button>
      <Button variant="primary" disabled={!ready} onClick={submit}>
        {prompt.submit}
      </Button>
    </>
  );

  return (
    <Dialog title={prompt.title} onClose={onCancel} footer={footer}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <TextField
          label={prompt.label}
          value={text}
          onChange={setText}
          placeholder={prompt.placeholder}
        />
      </form>
    </Dialog>
  );
}

interface ChoiceDialogProps {
  choice: Choice;
  onPick(option: string): void;
  onCancel(): void;
}

function ChoiceDialog({ choice, onPick, onCancel }: ChoiceDialogProps) {
  const filter = useCallback(
    (query: string) => filterTexts(choice.options, query),
    [choice.options],
  );
  return (
    <Dialog title={choice.title} onClose={onCancel}>
      <PickList
        label={choice.label}
        placeholder={choice.placeholder ?? ""}
        listLabel={choice.title}
        empty={choice.empty}
        filter={filter}
        keyOf={(option) => option}
        onPick={onPick}
        render={(option) => <span className={styles.label}>{option}</span>}
      />
    </Dialog>
  );
}
