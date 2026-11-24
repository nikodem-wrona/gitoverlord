//! Merge, rebase, cherry-pick, revert, and reset. The system `git` changes the history.

use std::path::Path;

use git2::{Commit, Oid, Repository};

use super::{conflict, operation, stash};
use crate::GitError;
use crate::cli::sequence::{self, Step};
use crate::cli::{reset as reset_cli, stash as stash_cli};
use crate::model::{OperationKind, OperationResult, ResetMode, ResetReceipt};

const BACKUP_MESSAGE: &str = "Reset by gitoverlord: the uncommitted changes";

/// Runs `work`, which starts an operation. Returns `Stopped` when `git` stops at conflicts.
pub(super) fn start(
    repo: &Repository,
    work: impl FnOnce() -> Result<(), GitError>,
) -> Result<OperationResult, GitError> {
    ready(repo)?;
    let previous = operation::head(repo)?;
    finish(repo, previous, work())
}

/// Applies the commit `hash` to the current branch. Rejects a commit that the branch has.
pub(super) fn cherry_pick(
    repo: &Repository,
    dir: &Path,
    hash: &str,
) -> Result<OperationResult, GitError> {
    let commit = find_commit(repo, hash)?;
    let head = Oid::from_str(&operation::head(repo)?)?;
    if commit.id() == head || repo.graph_descendant_of(head, commit.id())? {
        return Err(GitError::Rejected(
            "The current branch has this commit already.".to_owned(),
        ));
    }
    let merge = commit.parent_count() > 1;
    start(repo, || {
        sequence::cherry_pick(dir, &commit.id().to_string(), merge)
    })
}

/// Makes a commit that removes the changes of `hash`.
pub(super) fn revert(
    repo: &Repository,
    dir: &Path,
    hash: &str,
) -> Result<OperationResult, GitError> {
    let commit = find_commit(repo, hash)?;
    let merge = commit.parent_count() > 1;
    start(repo, || {
        sequence::revert(dir, &commit.id().to_string(), merge)
    })
}

/// Continues or skips the operation that stopped.
pub(super) fn step(repo: &Repository, dir: &Path, step: Step) -> Result<OperationResult, GitError> {
    let kind = stopped_kind(repo)?;
    if step == Step::Skip && kind == OperationKind::Merge {
        return Err(GitError::Rejected(
            "A merge has no commit to skip. Continue or abort it.".to_owned(),
        ));
    }
    if step == Step::Continue {
        no_conflicts(repo)?;
    }
    // A rebase moves the branch at its end. `ORIG_HEAD` has the commit from before.
    let before = match kind {
        OperationKind::Rebase => operation::reference(repo, "ORIG_HEAD"),
        _ => None,
    };
    let previous = before.map_or_else(|| operation::head(repo), Ok)?;
    finish(repo, previous, sequence::step(dir, kind, step))
}

/// Stops the operation and puts back the state from before it.
pub(super) fn abort(repo: &Repository, dir: &Path) -> Result<(), GitError> {
    sequence::step(dir, stopped_kind(repo)?, Step::Abort)
}

/// Moves the current branch to `hash`. A hard reset keeps the uncommitted changes in the stash.
pub(super) fn reset(
    repo: &Repository,
    dir: &Path,
    hash: &str,
    mode: ResetMode,
) -> Result<ResetReceipt, GitError> {
    ready(repo)?;
    let target = find_commit(repo, hash)?.id().to_string();
    let previous = operation::head(repo)?;
    let backup = match mode {
        ResetMode::Hard => backup(dir)?,
        ResetMode::Soft | ResetMode::Mixed => None,
    };
    reset_cli::reset(dir, &target, mode)?;
    Ok(ResetReceipt {
        mode,
        previous,
        backup,
    })
}

/// Moves the branch back to the commit from before the reset, then restores the backup.
pub(super) fn undo_reset(
    repo: &Repository,
    dir: &Path,
    receipt: &ResetReceipt,
) -> Result<(), GitError> {
    let previous = find_commit(repo, &receipt.previous)?.id().to_string();
    match receipt.mode {
        ResetMode::Hard => reset_cli::keep(dir, &previous)?,
        mode => reset_cli::reset(dir, &previous, mode)?,
    }
    if let Some(backup) = &receipt.backup {
        let index = stash::position(repo, backup)?;
        stash_cli::apply_with_index(dir, index)?;
        stash_cli::drop_entry(dir, index)?;
    }
    Ok(())
}

/// Moves the current branch back to `hash` and keeps the uncommitted changes.
pub(super) fn restore_head(repo: &Repository, dir: &Path, hash: &str) -> Result<(), GitError> {
    let target = find_commit(repo, hash)?.id().to_string();
    reset_cli::keep(dir, &target)
}

/// Gives the result of an operation step. A failure with conflicts is a stop.
fn finish(
    repo: &Repository,
    previous: String,
    result: Result<(), GitError>,
) -> Result<OperationResult, GitError> {
    if let Err(error) = result {
        let conflicts = conflict::paths(repo)?;
        if conflicts.is_empty() {
            return Err(error);
        }
        return Ok(OperationResult::Stopped { conflicts });
    }
    Ok(OperationResult::Done {
        previous,
        head: operation::head(repo)?,
    })
}

/// Rejects a new operation while another one waits or while files have conflicts.
fn ready(repo: &Repository) -> Result<(), GitError> {
    if let Some(stopped) = operation::read(repo)? {
        return Err(GitError::Rejected(format!(
            "Finish or abort the {} first.",
            name(stopped.kind)
        )));
    }
    no_conflicts(repo)
}

fn no_conflicts(repo: &Repository) -> Result<(), GitError> {
    match conflict::paths(repo)?.len() {
        0 => Ok(()),
        1 => Err(GitError::Rejected(
            "Resolve the conflicts first. 1 file has conflicts.".to_owned(),
        )),
        files => Err(GitError::Rejected(format!(
            "Resolve the conflicts first. {files} files have conflicts."
        ))),
    }
}

fn stopped_kind(repo: &Repository) -> Result<OperationKind, GitError> {
    let stopped = operation::read(repo)?;
    stopped.map(|found| found.kind).ok_or_else(|| {
        GitError::Rejected("No merge, rebase, cherry-pick, or revert has stopped.".to_owned())
    })
}

fn find_commit<'repo>(repo: &'repo Repository, hash: &str) -> Result<Commit<'repo>, GitError> {
    let id = stash::parse(hash)?;
    repo.find_commit(id)
        .map_err(|_| GitError::Rejected(format!("There is no commit {hash}.")))
}

fn backup(dir: &Path) -> Result<Option<String>, GitError> {
    let hash = stash_cli::create(dir, BACKUP_MESSAGE)?;
    if let Some(hash) = &hash {
        stash_cli::store(dir, hash, BACKUP_MESSAGE)?;
    }
    Ok(hash)
}

fn name(kind: OperationKind) -> &'static str {
    match kind {
        OperationKind::Merge => "merge",
        OperationKind::Rebase => "rebase",
        OperationKind::CherryPick => "cherry-pick",
        OperationKind::Revert => "revert",
    }
}
