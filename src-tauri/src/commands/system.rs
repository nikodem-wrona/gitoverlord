//! Commands that report the state of the machine.

use git_core::{GitError, GitVersion};

use crate::blocking::run_blocking;

/// Reports the version of the system `git`.
#[tauri::command]
#[specta::specta]
pub async fn detect_git() -> Result<GitVersion, GitError> {
    run_blocking(GitVersion::detect).await
}
