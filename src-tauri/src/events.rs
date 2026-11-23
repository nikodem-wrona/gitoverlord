//! Events that the backend sends to the user interface.

use git_core::RepoChange;
use serde::Serialize;
use specta::Type;
use tauri_specta::Event;

/// The open repository changed on the disk. The user interface reads it again.
#[derive(Debug, Clone, Serialize, Type, Event)]
#[serde(rename_all = "camelCase")]
pub struct RepoChanged {
    /// The path of the repository, as `RepoSummary` gives it.
    pub path: String,
    pub change: RepoChange,
}
