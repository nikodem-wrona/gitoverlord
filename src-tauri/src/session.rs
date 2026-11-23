//! The state of the application: the recent repositories, the file watcher, and
//! the GitHub token.

use std::path::{Path, PathBuf};
use std::sync::{Mutex, PoisonError};

use git_core::{GitError, HostToken, RecentRepo, RecentStore, RepoSummary, RepoWatcher, open_repo};
use tauri::{AppHandle, Manager};
use tauri_specta::Event;

use crate::events::RepoChanged;

const RECENT_FILE: &str = "recent.json";

pub struct Session {
    recents: RecentStore,
    /// The watcher of the open repository. A new watcher replaces the old one.
    watcher: Mutex<Option<RepoWatcher>>,
    /// The GitHub token. The outer `None` means that the keychain was not read yet.
    github: Mutex<Option<Option<String>>>,
}

impl Session {
    pub fn new(config_folder: PathBuf) -> Self {
        Self {
            recents: RecentStore::new(config_folder.join(RECENT_FILE)),
            watcher: Mutex::new(None),
            github: Mutex::new(None),
        }
    }

    pub fn recent(&self) -> Vec<RecentRepo> {
        self.recents.list()
    }

    /// The GitHub token, or `None` when the user did not sign in.
    ///
    /// The first call reads the keychain. A keychain that is not available gives `None`.
    pub fn github_token(&self) -> Option<String> {
        let mut cache = self.github.lock().unwrap_or_else(PoisonError::into_inner);
        let token = cache.get_or_insert_with(|| github::load_token().ok().flatten());
        token.clone()
    }

    /// Saves the token in the keychain, or removes it there when `token` is `None`.
    pub fn set_github_token(&self, token: Option<String>) -> Result<(), GitError> {
        match &token {
            Some(token) => github::save_token(token)?,
            None => github::delete_token()?,
        }
        *self.github.lock().unwrap_or_else(PoisonError::into_inner) = Some(token);
        Ok(())
    }

    /// The token that `git` gives to the HTTPS remotes on GitHub.
    pub fn host_token(&self) -> Option<HostToken> {
        self.github_token().map(github::host_token)
    }
}

/// Opens the repository that contains `path`, remembers it, and watches it.
pub fn open(app: &AppHandle, path: &str) -> Result<RepoSummary, GitError> {
    let summary = open_repo(Path::new(path))?.summary()?;
    let session = app.state::<Session>();
    session.recents.remember(RecentRepo {
        name: summary.name.clone(),
        path: summary.path.clone(),
    })?;

    // Without a watcher the repository is usable. It does not refresh on its own.
    let watcher = watch(app.clone(), summary.path.clone()).ok();
    *session
        .watcher
        .lock()
        .unwrap_or_else(PoisonError::into_inner) = watcher;
    Ok(summary)
}

fn watch(app: AppHandle, path: String) -> Result<RepoWatcher, GitError> {
    RepoWatcher::start(Path::new(&path.clone()), move |change| {
        let event = RepoChanged {
            path: path.clone(),
            change,
        };
        // A closed window cannot receive the event.
        let _ = event.emit(&app);
    })
}
