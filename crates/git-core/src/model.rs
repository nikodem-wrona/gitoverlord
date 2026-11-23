//! The data that the user interface receives. Each type goes through IPC as JSON.

mod change;
mod commit;
mod diff;
mod repo;
mod stash;
mod sync;

pub use change::{ChangeKind, FileDelta, WorkingTree};
pub use commit::{Commit, CommitDetail, LogPage};
pub use diff::{DiffHunk, DiffLine, DiffTarget, FileDiff, HunkTarget, LineKind};
pub use repo::{Branch, Head, RepoSummary};
pub use stash::StashEntry;
pub use sync::{HostToken, Progress, Remote};
