//! Commands that read and change the stash.

use git_core::{GitError, StashEntry};

use crate::blocking::with_repo;

/// Lists the stash entries. The newest entry is first.
#[tauri::command]
#[specta::specta]
pub async fn repo_stashes(path: String) -> Result<Vec<StashEntry>, GitError> {
    with_repo(path, |repo| repo.stashes()).await
}

/// Moves each change to a new stash entry, with the untracked files. Returns its hash.
#[tauri::command]
#[specta::specta]
pub async fn stash_changes(path: String, message: String) -> Result<String, GitError> {
    with_repo(path, move |repo| repo.stash(&message)).await
}

/// Applies a stash entry. The entry stays in the list.
#[tauri::command]
#[specta::specta]
pub async fn apply_stash(path: String, hash: String) -> Result<(), GitError> {
    with_repo(path, move |repo| repo.apply_stash(&hash)).await
}

/// Applies a stash entry and removes it from the list.
#[tauri::command]
#[specta::specta]
pub async fn pop_stash(path: String, hash: String) -> Result<(), GitError> {
    with_repo(path, move |repo| repo.pop_stash(&hash)).await
}

#[tauri::command]
#[specta::specta]
pub async fn drop_stash(path: String, hash: String) -> Result<(), GitError> {
    with_repo(path, move |repo| repo.drop_stash(&hash)).await
}

/// Puts a dropped entry back in the stash list.
#[tauri::command]
#[specta::specta]
pub async fn restore_stash(path: String, hash: String, message: String) -> Result<(), GitError> {
    with_repo(path, move |repo| repo.restore_stash(&hash, &message)).await
}
