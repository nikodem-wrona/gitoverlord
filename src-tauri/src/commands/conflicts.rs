//! Commands that read and resolve the files with conflicts.

use git_core::{ConflictFile, GitError, Resolution};

use crate::blocking::with_repo;

/// Reads one file with conflicts.
#[tauri::command]
#[specta::specta]
pub async fn conflict_file(path: String, file: String) -> Result<ConflictFile, GitError> {
    with_repo(path, move |repo| repo.conflict_file(&file)).await
}

/// Resolves the conflicts of one file and stages the file.
#[tauri::command]
#[specta::specta]
pub async fn resolve_conflict(
    path: String,
    file: String,
    resolution: Resolution,
) -> Result<(), GitError> {
    with_repo(path, move |repo| repo.resolve_conflict(&file, &resolution)).await
}

/// Puts the conflicts of a resolved file back.
#[tauri::command]
#[specta::specta]
pub async fn restore_conflict(path: String, file: String) -> Result<(), GitError> {
    with_repo(path, move |repo| repo.restore_conflict(&file)).await
}
