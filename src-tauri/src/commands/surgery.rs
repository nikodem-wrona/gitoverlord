//! Commands that change the history: merge, rebase, cherry-pick, revert, and reset.

use git_core::{GitError, OperationResult, ResetMode, ResetReceipt};

use crate::blocking::with_repo;

/// Merges `target`, a branch or a commit, into the current branch.
#[tauri::command]
#[specta::specta]
pub async fn merge_branch(path: String, target: String) -> Result<OperationResult, GitError> {
    with_repo(path, move |repo| repo.merge(&target)).await
}

/// Replays the commits of the current branch on top of `onto`.
#[tauri::command]
#[specta::specta]
pub async fn rebase_branch(path: String, onto: String) -> Result<OperationResult, GitError> {
    with_repo(path, move |repo| repo.rebase(&onto)).await
}

/// Applies the changes of a commit as a new commit on the current branch.
#[tauri::command]
#[specta::specta]
pub async fn cherry_pick(path: String, hash: String) -> Result<OperationResult, GitError> {
    with_repo(path, move |repo| repo.cherry_pick(&hash)).await
}

/// Makes a new commit that removes the changes of a commit.
#[tauri::command]
#[specta::specta]
pub async fn revert_commit(path: String, hash: String) -> Result<OperationResult, GitError> {
    with_repo(path, move |repo| repo.revert(&hash)).await
}

/// Commits the resolved changes of the operation that stopped, and goes on.
#[tauri::command]
#[specta::specta]
pub async fn continue_operation(path: String) -> Result<OperationResult, GitError> {
    with_repo(path, |repo| repo.continue_operation()).await
}

/// Drops the commit that the stopped operation applies, and goes on.
#[tauri::command]
#[specta::specta]
pub async fn skip_operation(path: String) -> Result<OperationResult, GitError> {
    with_repo(path, |repo| repo.skip_operation()).await
}

/// Stops the operation and puts back the state from before it.
#[tauri::command]
#[specta::specta]
pub async fn abort_operation(path: String) -> Result<(), GitError> {
    with_repo(path, |repo| repo.abort_operation()).await
}

/// Moves the current branch to a commit. Returns the data for the undo.
#[tauri::command]
#[specta::specta]
pub async fn reset_branch(
    path: String,
    hash: String,
    mode: ResetMode,
) -> Result<ResetReceipt, GitError> {
    with_repo(path, move |repo| repo.reset(&hash, mode)).await
}

/// Moves the branch back to the commit from before a reset, with the uncommitted changes.
#[tauri::command]
#[specta::specta]
pub async fn undo_reset(path: String, receipt: ResetReceipt) -> Result<(), GitError> {
    with_repo(path, move |repo| repo.undo_reset(&receipt)).await
}

/// Moves the current branch back to a commit and keeps the uncommitted changes.
#[tauri::command]
#[specta::specta]
pub async fn restore_head(path: String, hash: String) -> Result<(), GitError> {
    with_repo(path, move |repo| repo.restore_head(&hash)).await
}
