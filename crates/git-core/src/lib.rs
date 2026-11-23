//! Git access for gitoverlord.
//!
//! This crate does not depend on Tauri. The Tauri shell calls it and sends
//! the results to the user interface.

mod backend;
mod cli;
mod clone;
mod error;
#[cfg(test)]
mod fixture;
mod libgit;
mod model;
mod recent;
mod version;
mod watch;

pub use backend::{GitBackend, open_repo};
pub use clone::{clone_repo, clone_target};
pub use error::GitError;
pub use model::{
    Branch, ChangeKind, Commit, CommitDetail, DiffHunk, DiffLine, DiffTarget, FileDelta, FileDiff,
    Head, HunkTarget, LineKind, LogPage, Progress, Remote, RepoSummary, StashEntry, WorkingTree,
};
pub use recent::{RecentRepo, RecentStore};
pub use version::GitVersion;
pub use watch::{RepoChange, RepoWatcher};
