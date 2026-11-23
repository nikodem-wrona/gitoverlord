//! Commands that open a repository and read its references.

use git_core::{Branch, GitError, RecentRepo, RepoSummary};
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;

use crate::blocking::{run_blocking, with_repo};
use crate::session::{self, Session};

/// Asks the user for a folder. Returns `None` if the user cancels.
#[tauri::command]
#[specta::specta]
pub async fn pick_repository(app: AppHandle) -> Result<Option<String>, GitError> {
    let pick = move || {
        let dialog = app.dialog().file().set_title("Open a repository");
        let folder = dialog.blocking_pick_folder()?.into_path().ok()?;
        Some(folder.to_string_lossy().into_owned())
    };
    Ok(run_blocking(pick).await)
}

/// Opens the repository that contains `path`, and starts to watch it.
#[tauri::command]
#[specta::specta]
pub async fn open_repository(app: AppHandle, path: String) -> Result<RepoSummary, GitError> {
    run_blocking(move || session::open(&app, &path)).await
}

/// Lists the repositories that the user opened. The newest is first.
#[tauri::command]
#[specta::specta]
pub async fn recent_repositories(app: AppHandle) -> Result<Vec<RecentRepo>, GitError> {
    Ok(run_blocking(move || app.state::<Session>().recent()).await)
}

/// Reads the name, the path, `HEAD`, the remotes, and the tags of a repository.
#[tauri::command]
#[specta::specta]
pub async fn repo_summary(path: String) -> Result<RepoSummary, GitError> {
    with_repo(path, |repo| repo.summary()).await
}

/// Lists the local branches. The current branch is first.
#[tauri::command]
#[specta::specta]
pub async fn repo_branches(path: String) -> Result<Vec<Branch>, GitError> {
    with_repo(path, |repo| repo.branches()).await
}

/// Counts the commits on each of the last `days` days. The oldest day is first.
#[tauri::command]
#[specta::specta]
pub async fn repo_activity(path: String, days: u32) -> Result<Vec<u32>, GitError> {
    with_repo(path, move |repo| repo.activity(days)).await
}
