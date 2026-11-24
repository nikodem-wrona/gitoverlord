use serde::{Deserialize, Serialize};
use specta::Type;

/// A git operation that can stop and wait for the user, for example at a conflict.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum OperationKind {
    Merge,
    Rebase,
    CherryPick,
    Revert,
}

/// An operation that stopped. The user continues it, skips a commit, or aborts it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Operation {
    pub kind: OperationKind,
    /// The commit that `git` applies now. `None` when `git` does not say.
    pub commit: Option<String>,
    /// The branch that a rebase changes. `HEAD` is detached while a rebase runs.
    pub branch: Option<String>,
    /// The step of a rebase, from 1. `None` for the other operations.
    pub step: Option<u32>,
    /// The count of the steps of a rebase.
    pub steps: Option<u32>,
}

/// The result of a merge, rebase, cherry-pick, or revert.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum OperationResult {
    /// The operation is complete. `previous` is the commit of `HEAD` before it,
    /// for the undo. `head` is the commit of `HEAD` now.
    Done { previous: String, head: String },
    /// `git` stopped at conflicts in these files. The user resolves them, then
    /// continues or aborts the operation.
    Stopped { conflicts: Vec<String> },
}

/// What a reset does with the changes of the commits that the branch drops.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum ResetMode {
    /// The changes stay in the index.
    Soft,
    /// The changes stay in the working tree.
    Mixed,
    /// The changes go. A stash entry keeps the uncommitted changes.
    Hard,
}

/// The data that the undo of a reset needs.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ResetReceipt {
    pub mode: ResetMode,
    /// The commit of `HEAD` before the reset.
    pub previous: String,
    /// The stash entry with the uncommitted changes from before a hard reset.
    pub backup: Option<String>,
}
