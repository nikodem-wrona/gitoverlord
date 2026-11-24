//! Merge, rebase, cherry-pick, and revert. Each one can stop at conflicts.

use std::path::Path;

use super::{checked_name, run_git_in};
use crate::GitError;
use crate::model::OperationKind;

/// What to do with an operation that stopped.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum Step {
    /// Commits the resolved changes and goes on.
    Continue,
    /// Drops the commit that the operation applies now and goes on.
    Skip,
    /// Puts back the state from before the operation.
    Abort,
}

/// Merges `target` into the current branch. A fast-forward makes no merge commit.
pub(crate) fn merge(dir: &Path, target: &str) -> Result<(), GitError> {
    run_git_in(dir, &["merge", "--no-edit", checked_name(target)?]).map(drop)
}

/// Replays the commits of the current branch on top of `onto`.
pub(crate) fn rebase(dir: &Path, onto: &str) -> Result<(), GitError> {
    run_git_in(dir, &["rebase", checked_name(onto)?]).map(drop)
}

/// Applies the changes of `hash`. A merge commit gives the changes against its first parent.
pub(crate) fn cherry_pick(dir: &Path, hash: &str, merge: bool) -> Result<(), GitError> {
    run_git_in(dir, &with_mainline(&["cherry-pick"], merge, hash)).map(drop)
}

/// Makes a new commit that removes the changes of `hash`.
pub(crate) fn revert(dir: &Path, hash: &str, merge: bool) -> Result<(), GitError> {
    run_git_in(dir, &with_mainline(&["revert", "--no-edit"], merge, hash)).map(drop)
}

/// Continues, skips, or aborts the operation `kind` that stopped.
pub(crate) fn step(dir: &Path, kind: OperationKind, step: Step) -> Result<(), GitError> {
    let command = match kind {
        OperationKind::Merge => "merge",
        OperationKind::Rebase => "rebase",
        OperationKind::CherryPick => "cherry-pick",
        OperationKind::Revert => "revert",
    };
    let flag = match step {
        Step::Continue => "--continue",
        Step::Skip => "--skip",
        Step::Abort => "--abort",
    };
    run_git_in(dir, &[command, flag]).map(drop)
}

fn with_mainline<'a>(start: &[&'a str], merge: bool, hash: &'a str) -> Vec<&'a str> {
    let mut args = start.to_vec();
    if merge {
        args.extend(["--mainline", "1"]);
    }
    args.push(hash);
    args
}
