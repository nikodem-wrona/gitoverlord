//! Commands that read and change the working tree and the index.

use git_core::{DiffTarget, FileDiff, GitError, HunkTarget, WorkingTree};

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

/// Adds the changes of `files` to the index.
#[tauri::command]
#[specta::specta]
pub async fn stage_files(path: String, files: Vec<String>) -> Result<(), GitError> {
    with_repo(path, move |repo| repo.stage(&files)).await
}

/// Removes the changes of `files` from the index. The working tree keeps them.
#[tauri::command]
#[specta::specta]
pub async fn unstage_files(path: String, files: Vec<String>) -> Result<(), GitError> {
    with_repo(path, move |repo| repo.unstage(&files)).await
}

/// Adds one hunk of the unstaged changes to the index.
#[tauri::command]
#[specta::specta]
pub async fn stage_hunk(path: String, hunk: HunkTarget) -> Result<(), GitError> {
    with_repo(path, move |repo| repo.stage_hunk(&hunk)).await
}

/// Removes one hunk of the staged changes from the index.
#[tauri::command]
#[specta::specta]
pub async fn unstage_hunk(path: String, hunk: HunkTarget) -> Result<(), GitError> {
    with_repo(path, move |repo| repo.unstage_hunk(&hunk)).await
}

/// Removes the unstaged changes of `files`. Returns the hash of the stash entry that keeps a copy.
#[tauri::command]
#[specta::specta]
pub async fn discard_changes(path: String, files: Vec<String>) -> Result<String, GitError> {
    with_repo(path, move |repo| repo.discard(&files)).await
}

/// Writes the changes of a discard back to the working tree, then drops its stash entry.
#[tauri::command]
#[specta::specta]
pub async fn restore_discarded(path: String, hash: String) -> Result<(), GitError> {
    with_repo(path, move |repo| repo.restore_discarded(&hash)).await
}
