//! Events that the backend sends to the user interface.

use git_core::{Progress, RepoChange};
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

/// The network operation that a `SyncProgress` event belongs to.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum SyncOperation {
    Fetch,
    Pull,
    /// A push, also the push that publishes a branch.
    Push,
    Clone,
}

/// A network operation made progress, or it ended.
#[derive(Debug, Clone, Serialize, Type, Event)]
#[serde(rename_all = "camelCase")]
pub struct SyncProgress {
    /// The path of the repository. For a clone, the path of the new working tree.
    pub path: String,
    pub operation: SyncOperation,
    /// The current step. `None` when the operation ended.
    pub step: Option<Progress>,
}
