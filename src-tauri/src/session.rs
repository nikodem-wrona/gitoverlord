//! The state of the application: the recent repositories and the file watcher.

use std::path::{Path, PathBuf};
use std::sync::{Mutex, PoisonError};

use git_core::{GitError, RecentRepo, RecentStore, RepoSummary, RepoWatcher, open_repo};
use tauri::{AppHandle, Manager};
use tauri_specta::Event;

use crate::events::RepoChanged;

const RECENT_FILE: &str = "recent.json";

pub struct Session {
    recents: RecentStore,
    /// The watcher of the open repository. A new watcher replaces the old one.
    watcher: Mutex<Option<RepoWatcher>>,
}

impl Session {
    pub fn new(config_folder: PathBuf) -> Self {
        Self {
            recents: RecentStore::new(config_folder.join(RECENT_FILE)),
            watcher: Mutex::new(None),
        }
    }

    pub fn recent(&self) -> Vec<RecentRepo> {
        self.recents.list()
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
