//! Commands that make commits.

use git_core::GitError;

use crate::blocking::with_repo;

/// Commits the staged changes and returns the new hash. `amend` replaces the last commit.
#[tauri::command]
#[specta::specta]
pub async fn commit_changes(
    path: String,
    message: String,
    amend: bool,
) -> Result<String, GitError> {
    with_repo(path, move |repo| repo.commit(&message, amend)).await
}
