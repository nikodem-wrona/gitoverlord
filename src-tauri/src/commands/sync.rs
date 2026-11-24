//! Commands that use the network: fetch, pull, push, publish, and clone.
//!
//! A `SyncProgress` event reports each step, and one more event reports the end.

use std::path::Path;
use std::sync::{Mutex, PoisonError};

use git_core::{
    GitBackend, GitError, Progress, Remote, clone_repo, clone_target, open_repo_with_token,
};
use tauri::{AppHandle, Manager};
use tauri_specta::Event;

use crate::blocking::{run_blocking, with_repo};
use crate::events::{SyncOperation, SyncProgress};
use crate::session::Session;

/// One network operation runs at a time. A background fetch waits for a push.
static NETWORK: Mutex<()> = Mutex::new(());

/// Lists the remotes with their remote branches.
#[tauri::command]
#[specta::specta]
pub async fn repo_remotes(path: String) -> Result<Vec<Remote>, GitError> {
    with_repo(path, |repo| repo.remotes()).await
}

#[tauri::command]
#[specta::specta]
pub async fn add_remote(path: String, name: String, url: String) -> Result<(), GitError> {
    with_repo(path, move |repo| repo.add_remote(&name, &url)).await
}

/// Fetches each remote.
#[tauri::command]
#[specta::specta]
pub async fn fetch_remotes(app: AppHandle, path: String) -> Result<(), GitError> {
    sync(app, path, SyncOperation::Fetch, |repo, progress| {
        repo.fetch(progress)
    })
    .await
}

/// Fast-forwards the current branch to its upstream.
#[tauri::command]
#[specta::specta]
pub async fn pull_branch(app: AppHandle, path: String) -> Result<(), GitError> {
    sync(app, path, SyncOperation::Pull, |repo, progress| {
        repo.pull(progress)
    })
    .await
}

/// Sends the commits of the current branch to its upstream.
#[tauri::command]
#[specta::specta]
pub async fn push_branch(app: AppHandle, path: String) -> Result<(), GitError> {
    sync(app, path, SyncOperation::Push, |repo, progress| {
        repo.push(progress)
    })
    .await
}

/// Pushes the current branch and makes the remote branch its upstream. Returns the upstream.
#[tauri::command]
#[specta::specta]
pub async fn publish_branch(app: AppHandle, path: String) -> Result<String, GitError> {
    sync(app, path, SyncOperation::Push, |repo, progress| {
        repo.publish(progress)
    })
    .await
}

/// Replaces the upstream with the current branch. Returns the commit that the upstream had.
#[tauri::command]
#[specta::specta]
pub async fn force_push_branch(app: AppHandle, path: String) -> Result<String, GitError> {
    sync(app, path, SyncOperation::Push, |repo, progress| {
        repo.force_push(progress)
    })
    .await
}

/// Puts the commit `previous` back on the upstream after a force push.
#[tauri::command]
#[specta::specta]
pub async fn undo_force_push(
    app: AppHandle,
    path: String,
    previous: String,
) -> Result<(), GitError> {
    sync(app, path, SyncOperation::Push, move |repo, progress| {
        repo.undo_force_push(&previous, progress)
    })
    .await
}

/// Clones `url` into a new folder in `parent`. Returns the path of the new working tree.
#[tauri::command]
#[specta::specta]
pub async fn clone_repository(
    app: AppHandle,
    url: String,
    parent: String,
) -> Result<String, GitError> {
    run_blocking(move || {
        let target = clone_target(&url, Path::new(&parent))?;
        let path = target.to_string_lossy().into_owned();
        let token = app.state::<Session>().host_token();
        report(&app, &path, SyncOperation::Clone, |progress| {
            clone_repo(&url, &target, token.as_ref(), progress)
        })?;
        Ok(path)
    })
    .await
}

/// Runs a network operation on the repository at `path`, off the main thread.
async fn sync<T, F>(
    app: AppHandle,
    path: String,
    operation: SyncOperation,
    work: F,
) -> Result<T, GitError>
where
    T: Send + 'static,
    F: FnOnce(&dyn GitBackend, &mut dyn FnMut(Progress)) -> Result<T, GitError> + Send + 'static,
{
    run_blocking(move || {
        // After a GitHub sign-in, `git` uses the token for the HTTPS remotes on GitHub.
        let token = app.state::<Session>().host_token();
        let repo = open_repo_with_token(Path::new(&path), token)?;
        report(&app, &path, operation, |progress| {
            work(repo.as_ref(), progress)
        })
    })
    .await
}

/// Runs `work` when no other network operation runs, and sends its progress events.
fn report<T>(
    app: &AppHandle,
    path: &str,
    operation: SyncOperation,
    work: impl FnOnce(&mut dyn FnMut(Progress)) -> Result<T, GitError>,
) -> Result<T, GitError> {
    let _turn = NETWORK.lock().unwrap_or_else(PoisonError::into_inner);
    let send = |step: Option<Progress>| {
        let event = SyncProgress {
            path: path.to_owned(),
            operation,
            step,
        };
        // A closed window cannot receive the event.
        let _ = event.emit(app);
    };
    let result = work(&mut |step| send(Some(step)));
    send(None);
    result
}
