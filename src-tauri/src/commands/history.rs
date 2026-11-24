//! Commands that read the commit history.

use git_core::{CommitDetail, GitError, LogPage};

use crate::blocking::with_repo;

/// Reads `limit` commits after the first `skip` commits. The newest commit is first.
#[tauri::command]
#[specta::specta]
pub async fn repo_log(path: String, skip: u32, limit: u32) -> Result<LogPage, GitError> {
    with_repo(path, move |repo| repo.log(skip, limit)).await
}

/// Reads one commit with its message and its changed files.
#[tauri::command]
#[specta::specta]
pub async fn commit_detail(path: String, hash: String) -> Result<CommitDetail, GitError> {
    with_repo(path, move |repo| repo.commit_detail(&hash)).await
}
