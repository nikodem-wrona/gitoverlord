//! The data that the user interface receives. Each type goes through IPC as JSON.

mod change;
mod commit;
mod diff;
mod repo;

pub use change::{ChangeKind, FileDelta, WorkingTree};
pub use commit::{Commit, CommitDetail, LogPage};
pub use diff::{DiffHunk, DiffLine, DiffTarget, FileDiff, LineKind};
pub use repo::{Branch, Head, RepoSummary};
