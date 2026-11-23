//! Commands that read the working tree and the diffs.

use git_core::{DiffTarget, FileDiff, GitError, WorkingTree};

use crate::blocking::with_repo;

/// Reads the staged and the unstaged changes.
#[tauri::command]
#[specta::specta]
pub async fn repo_status(path: String) -> Result<WorkingTree, GitError> {
    with_repo(path, |repo| repo.status()).await
}

/// Reads the changed lines of one file.
#[tauri::command]
#[specta::specta]
pub async fn file_diff(path: String, target: DiffTarget) -> Result<FileDiff, GitError> {
    with_repo(path, move |repo| repo.file_diff(&target)).await
}
