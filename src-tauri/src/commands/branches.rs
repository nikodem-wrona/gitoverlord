//! Commands that read and change the local branches.

use git_core::{Branch, GitError};

use crate::blocking::with_repo;

/// Lists the local branches. The current branch is first.
#[tauri::command]
#[specta::specta]
pub async fn repo_branches(path: String) -> Result<Vec<Branch>, GitError> {
    with_repo(path, |repo| repo.branches()).await
}

/// Creates a branch at `start`, or at `HEAD`, and switches to it.
#[tauri::command]
#[specta::specta]
pub async fn create_branch(
    path: String,
    name: String,
    start: Option<String>,
) -> Result<(), GitError> {
    with_repo(path, move |repo| {
        repo.create_branch(&name, start.as_deref(), true)
    })
    .await
}

/// Makes a deleted branch again at its last commit. The current branch does not change.
#[tauri::command]
#[specta::specta]
pub async fn restore_branch(path: String, name: String, hash: String) -> Result<(), GitError> {
    with_repo(path, move |repo| {
        repo.create_branch(&name, Some(&hash), false)
    })
    .await
}

/// Makes `name` the current branch.
#[tauri::command]
#[specta::specta]
pub async fn switch_branch(path: String, name: String) -> Result<(), GitError> {
    with_repo(path, move |repo| repo.switch_branch(&name)).await
}

#[tauri::command]
#[specta::specta]
pub async fn rename_branch(path: String, name: String, new_name: String) -> Result<(), GitError> {
    with_repo(path, move |repo| repo.rename_branch(&name, &new_name)).await
}

/// Deletes a branch, also if it is not merged. Returns the hash of its last commit.
#[tauri::command]
#[specta::specta]
pub async fn delete_branch(path: String, name: String) -> Result<String, GitError> {
    with_repo(path, move |repo| repo.delete_branch(&name)).await
}
