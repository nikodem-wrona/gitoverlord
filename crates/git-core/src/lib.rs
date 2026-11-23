//! Git access for gitoverlord.
//!
//! This crate does not depend on Tauri. The Tauri shell calls it and sends
//! the results to the user interface.

mod backend;
mod cli;
mod error;
#[cfg(test)]
mod fixture;
mod libgit;
mod model;
mod recent;
mod version;
mod watch;

pub use backend::{GitBackend, open_repo};
pub use error::GitError;
pub use model::{
    Branch, ChangeKind, Commit, CommitDetail, DiffHunk, DiffLine, DiffTarget, FileDelta, FileDiff,
    Head, LineKind, LogPage, RepoSummary, WorkingTree,
};
pub use recent::{RecentRepo, RecentStore};
pub use version::GitVersion;
pub use watch::{RepoChange, RepoWatcher};
