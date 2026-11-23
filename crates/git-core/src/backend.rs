use std::path::Path;

use crate::GitError;
use crate::libgit::Git2Backend;
use crate::model::{Branch, CommitDetail, DiffTarget, FileDiff, LogPage, RepoSummary, WorkingTree};

/// Read access to one repository.
///
/// The user interface does not know which git engine gives the data.
pub trait GitBackend {
    /// Reads the name, the path, `HEAD`, the remotes, and the tags.
    fn summary(&self) -> Result<RepoSummary, GitError>;
    /// Reads the staged and the unstaged changes.
    fn status(&self) -> Result<WorkingTree, GitError>;
    /// Reads `limit` commits after the first `skip` commits. The newest commit is first.
    fn log(&self, skip: u32, limit: u32) -> Result<LogPage, GitError>;
    /// Reads the local branches. The current branch is first.
    fn branches(&self) -> Result<Vec<Branch>, GitError>;
    /// Reads one commit with its changed files.
    fn commit_detail(&self, hash: &str) -> Result<CommitDetail, GitError>;
    /// Reads the changed lines of one file.
    fn file_diff(&self, target: &DiffTarget) -> Result<FileDiff, GitError>;
    /// Counts the commits on each of the last `days` days. The oldest day is first.
    fn activity(&self, days: u32) -> Result<Vec<u32>, GitError>;
}

/// Opens the repository that contains `path`.
///
/// # Errors
///
/// Returns `GitError::NotARepository` if `path` is not in a repository that
/// has a working tree.
pub fn open_repo(path: &Path) -> Result<Box<dyn GitBackend>, GitError> {
    Ok(Box::new(Git2Backend::open(path)?))
}
