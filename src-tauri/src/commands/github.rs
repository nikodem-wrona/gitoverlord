//! Commands for GitHub: the sign-in, the account, and the pull requests.
//!
//! The token stays in the backend. The user interface never receives it.

use std::path::Path;

use git_core::{GitBackend, GitError, open_repo};
use github::{
    Account, CreatedPull, DeviceCode, GitHub, HubRepository, Poll, PullList, RepoId, SignInStep,
};
use tauri::{AppHandle, Manager};
use tauri_plugin_opener::OpenerExt;

use crate::blocking::run_blocking;
use crate::session::Session;

const PAGE_PREFIX: &str = "https://github.com/";

/// The account of the saved token. `None` when the user did not sign in, or when
/// GitHub refuses the token. A refused token is removed.
#[tauri::command]
#[specta::specta]
pub async fn github_account(app: AppHandle) -> Result<Option<Account>, GitError> {
    run_blocking(move || {
        if app.state::<Session>().github_token().is_none() {
            return Ok(None);
        }
        match with_github(&app, GitHub::account) {
            Ok(account) => Ok(Some(account)),
            Err(GitError::SignInExpired) => Ok(None),
            Err(error) => Err(error),
        }
    })
    .await
}

/// Starts a sign-in. The user types the code of the answer on GitHub.
#[tauri::command]
#[specta::specta]
pub async fn github_start_sign_in() -> Result<DeviceCode, GitError> {
    run_blocking(|| GitHub::new(None).start_sign_in(&github::client_id())).await
}

/// Asks GitHub one time if the user typed the code. When the sign-in is done,
/// the token goes to the keychain.
#[tauri::command]
#[specta::specta]
pub async fn github_poll_sign_in(
    app: AppHandle,
    device_code: String,
) -> Result<SignInStep, GitError> {
    run_blocking(move || {
        let poll = GitHub::new(None).poll_sign_in(&github::client_id(), &device_code)?;
        Ok(match poll {
            Poll::Pending => SignInStep::Pending,
            Poll::SlowDown => SignInStep::SlowDown,
            Poll::Expired => SignInStep::Expired,
            Poll::Denied => SignInStep::Denied,
            Poll::Token(token) => {
                let account = GitHub::new(Some(token.clone())).account()?;
                app.state::<Session>().set_github_token(Some(token))?;
                SignInStep::Done(account)
            }
        })
    })
    .await
}

/// Removes the token from the keychain.
#[tauri::command]
#[specta::specta]
pub async fn github_sign_out(app: AppHandle) -> Result<(), GitError> {
    run_blocking(move || app.state::<Session>().set_github_token(None)).await
}

/// Lists the repositories that the user pushed to most recently.
#[tauri::command]
#[specta::specta]
pub async fn github_repositories(app: AppHandle) -> Result<Vec<HubRepository>, GitError> {
    run_blocking(move || with_github(&app, GitHub::repositories)).await
}

/// Reads the open pull requests of the GitHub remote of the repository at
/// `path`. `None` when the repository has no remote on GitHub.
#[tauri::command]
#[specta::specta]
pub async fn github_pull_requests(
    app: AppHandle,
    path: String,
) -> Result<Option<PullList>, GitError> {
    run_blocking(move || {
        let Some((_, repository)) = hub_remote(open_repo(Path::new(&path))?.as_ref())? else {
            return Ok(None);
        };
        with_github(&app, |hub| hub.pull_requests(&repository)).map(Some)
    })
    .await
}

/// Opens a pull request from the upstream of the current branch into `base`.
#[tauri::command]
#[specta::specta]
pub async fn github_create_pull_request(
    app: AppHandle,
    path: String,
    title: String,
    base: String,
) -> Result<CreatedPull, GitError> {
    run_blocking(move || {
        let repo = open_repo(Path::new(&path))?;
        let (remote, repository) = hub_remote(repo.as_ref())?
            .ok_or_else(|| GitError::Rejected("The repository has no GitHub remote.".into()))?;
        let branches = repo.branches()?;
        let head = branches
            .iter()
            .find(|branch| branch.current)
            .and_then(|branch| github::branch_on_remote(branch, &remote))
            .ok_or_else(|| GitError::Rejected(format!("Publish the branch to {remote} first.")))?;
        with_github(&app, |hub| {
            hub.create_pull_request(&repository, &title, &head, &base)
        })
    })
    .await
}

/// Opens a GitHub page in the browser of the user. Other addresses are refused.
#[tauri::command]
#[specta::specta]
pub async fn open_github_page(app: AppHandle, url: String) -> Result<(), GitError> {
    if !url.starts_with(PAGE_PREFIX) {
        return Err(GitError::Rejected(format!("{url} is not a GitHub page.")));
    }
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|error| GitError::Io(error.to_string()))
}

/// Runs `work` with a client that has the token. A token that GitHub refuses is removed.
fn with_github<T>(
    app: &AppHandle,
    work: impl FnOnce(&GitHub) -> Result<T, GitError>,
) -> Result<T, GitError> {
    let session = app.state::<Session>();
    let token = session
        .github_token()
        .ok_or_else(|| GitError::Rejected("Sign in to GitHub first.".into()))?;
    let result = work(&GitHub::new(Some(token)));
    if matches!(result, Err(GitError::SignInExpired)) {
        session.set_github_token(None)?;
    }
    result
}

fn hub_remote(repo: &dyn GitBackend) -> Result<Option<(String, RepoId)>, GitError> {
    Ok(github::github_remote(&repo.remotes()?))
}
