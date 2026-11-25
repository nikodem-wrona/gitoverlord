import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type GitError, unwrap } from "@/ipc";
import { renderWithProviders } from "@/test/renderWithProviders";

import { ActionButton } from "./ActionButton";
import { useRegisterActions } from "./actionContext";
import { defineAction } from "./defineAction";
import type { ActionSpec } from "./types";

function makeAction(extra: Partial<ActionSpec> = {}) {
  return defineAction({
    id: "test.run",
    label: "Launch probe",
    group: "View",
    run: () => {},
    ...extra,
  });
}

function Harness(props: Partial<ActionSpec>) {
  const action = makeAction(props);
  useRegisterActions([action]);
  return <ActionButton action={action} />;
}

const button = () => screen.getByRole("button", { name: "Launch probe" });

describe("actions", () => {
  it("runs from a button and shows the result with an Undo button", async () => {
    const undo = vi.fn<() => Promise<void>>(() => Promise.resolve());
    renderWithProviders(
      <Harness run={async () => ({ title: "Probe launched", undo })} />,
    );

    fireEvent.click(button());
    fireEvent.click(await screen.findByRole("button", { name: "Undo" }));

    expect(undo).toHaveBeenCalledOnce();
    expect(await screen.findByText("Undone")).toBeInTheDocument();
  });

  it("asks before a destructive action, and Cancel does not run it", async () => {
    const run = vi.fn<(text: string) => void>();
    const confirm = {
      title: "Launch?",
      message: "It cannot stop.",
      confirm: "Launch",
    };
    renderWithProviders(<Harness confirm={confirm} run={run} />);

    fireEvent.click(button());
    const dialog = screen.getByRole("dialog", { name: "Launch?" });
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(dialog).not.toBeInTheDocument();
    expect(run).not.toHaveBeenCalled();

    fireEvent.click(button());
    fireEvent.click(screen.getByRole("button", { name: "Launch" }));
    await waitFor(() => expect(run).toHaveBeenCalledOnce());
  });

  it("asks the question of the action that follows a result", async () => {
    const land = vi.fn<(text: string) => void>();
    const confirm = {
      title: "Land?",
      message: "It comes down.",
      confirm: "Land",
    };
    const next = makeAction({ id: "test.land", confirm, run: land });
    renderWithProviders(
      <Harness run={async () => ({ title: "Probe launched", next })} />,
    );

    fireEvent.click(button());
    expect(await screen.findByText("Probe launched")).toBeInTheDocument();
    expect(land).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Land" }));

    await waitFor(() => expect(land).toHaveBeenCalledOnce());
  });

  it("runs at once an action without a question that follows a result", async () => {
    const land = vi.fn<(text: string) => void>();
    const confirm = {
      title: "Launch?",
      message: "It goes.",
      confirm: "Launch",
    };
    const next = makeAction({ id: "test.land", run: land });
    renderWithProviders(
      <Harness confirm={confirm} run={async () => ({ title: "Up", next })} />,
    );

    fireEvent.click(button());
    fireEvent.click(screen.getByRole("button", { name: "Launch" }));

    await waitFor(() => expect(land).toHaveBeenCalledOnce());
  });

  it("asks for a text and gives it to the action", async () => {
    const run = vi.fn<(text: string) => void>();
    const prompt = { title: "Name the probe", label: "Name", submit: "Launch" };
    renderWithProviders(<Harness prompt={prompt} run={run} />);

    fireEvent.click(button());
    const field = screen.getByRole("textbox", { name: "Name" });
    expect(screen.getByRole("button", { name: "Launch" })).toBeDisabled();
    fireEvent.change(field, { target: { value: " voyager " } });
    fireEvent.submit(field);

    await waitFor(() => expect(run).toHaveBeenCalledWith("voyager"));
  });

  it("asks for one option, finds it by its name, and gives it to the action", async () => {
    const run = vi.fn<(text: string) => void>();
    const choose = {
      title: "Pick a probe",
      label: "Search the probes",
      options: ["voyager", "pioneer", "cassini"],
      empty: "No probe has this name.",
    };
    renderWithProviders(<Harness choose={choose} run={run} />);

    fireEvent.click(button());
    const search = screen.getByRole("textbox", { name: "Search the probes" });
    expect(screen.getAllByRole("option")).toHaveLength(3);
    fireEvent.change(search, { target: { value: "IONEER" } });
    expect(screen.getAllByRole("option")).toHaveLength(1);
    fireEvent.keyDown(search, { key: "Enter" });

    await waitFor(() => expect(run).toHaveBeenCalledWith("pioneer"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows a failure as a notification", async () => {
    const error: GitError = { kind: "rejected", message: "The probe is lost." };
    const run = () => unwrap<void>(Promise.resolve({ status: "error", error }));
    renderWithProviders(<Harness run={run} />);

    fireEvent.click(button());

    expect(await screen.findByText("Launch probe failed")).toBeInTheDocument();
    expect(screen.getByText("The probe is lost.")).toBeInTheDocument();
  });

  it("disables a blocked action and shows the reason", () => {
    renderWithProviders(<Harness blocked="Fuel the probe first." />);

    expect(button()).toBeDisabled();
    expect(button()).toHaveAttribute("title", "Fuel the probe first.");
  });

  it("runs a registered action with its shortcut", async () => {
    const run = vi.fn<(text: string) => void>();
    renderWithProviders(<Harness shortcut="Mod+Shift+L" run={run} />);

    fireEvent.keyDown(window, { key: "L", ctrlKey: true, shiftKey: true });

    await waitFor(() => expect(run).toHaveBeenCalledOnce());
  });

  it("finds a registered action in the command palette", async () => {
    const run = vi.fn<(text: string) => void>();
    renderWithProviders(<Harness run={run} />);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const search = screen.getByRole("textbox", { name: "Search the commands" });
    fireEvent.change(search, { target: { value: "probe" } });
    expect(screen.getByRole("option", { name: /Launch probe/ })).toBeVisible();
    fireEvent.keyDown(search, { key: "Enter" });

    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(run).toHaveBeenCalledOnce());
  });
});
