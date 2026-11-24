//! The data that the user interface receives. Each type goes through IPC as JSON.

mod change;
mod commit;
mod conflict;
mod diff;
mod operation;
mod repo;
mod stash;
mod sync;

pub use change::{ChangeKind, FileDelta, WorkingTree};
pub use commit::{Commit, CommitDetail, LogPage};
pub use conflict::{ConflictBlock, ConflictChoice, ConflictFile, ConflictSide, Resolution};
pub use diff::{DiffHunk, DiffLine, DiffTarget, FileDiff, HunkTarget, LineKind};
pub use operation::{Operation, OperationKind, OperationResult, ResetMode, ResetReceipt};
pub use repo::{Branch, Head, RepoSummary};
pub use stash::StashEntry;
pub use sync::{HostToken, Progress, Remote};
