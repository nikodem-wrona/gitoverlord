use serde::Serialize;
use specta::Type;

/// One step of a network operation, from the progress output of `git`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Progress {
    /// What `git` does now, for example `Receiving objects`.
    pub phase: String,
    /// The part of the phase that is done, from 0 to 100. `None` when `git` gives no total.
    pub percent: Option<u8>,
}

/// A remote repository.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Remote {
    pub name: String,
    /// The fetch URL. An HTTP URL has no user name and no password here.
    /// `None` when the remote has no URL.
    pub url: Option<String>,
    /// The remote branches from the last fetch, for example `origin/main`.
    pub branches: Vec<String>,
}
