use std::path::Path;

use crate::GitError;
use crate::libgit::Git2Backend;
use crate::model::{
    Branch, CommitDetail, DiffTarget, FileDiff, HostToken, HunkTarget, LogPage, Progress, Remote,
    RepoSummary, StashEntry, WorkingTree,
};

/// Access to one repository.
///
/// The read operations do not change the repository. The write operations run
/// the system `git`, so hooks, signing, and the configuration of the user apply.
/// The user interface does not know which engine does the work.
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
    /// Reads the stash entries. The newest entry is first.
    fn stashes(&self) -> Result<Vec<StashEntry>, GitError>;
    /// Reads the remotes with their remote branches.
    fn remotes(&self) -> Result<Vec<Remote>, GitError>;

    /// Adds the changes of `paths` to the index.
    fn stage(&self, paths: &[String]) -> Result<(), GitError>;
    /// Removes the changes of `paths` from the index. The working tree keeps them.
    fn unstage(&self, paths: &[String]) -> Result<(), GitError>;
    /// Adds one hunk of the unstaged changes to the index.
    fn stage_hunk(&self, hunk: &HunkTarget) -> Result<(), GitError>;
    /// Removes one hunk of the staged changes from the index.
    fn unstage_hunk(&self, hunk: &HunkTarget) -> Result<(), GitError>;
    /// Removes the unstaged changes of `paths`. Returns the hash of the stash
    /// entry that keeps a copy of the changes.
    fn discard(&self, paths: &[String]) -> Result<String, GitError>;
    /// Writes the changes of a discard back to the working tree, then drops its entry.
    fn restore_discarded(&self, hash: &str) -> Result<(), GitError>;
    /// Commits the staged changes and returns the new hash. `amend` replaces the last commit.
    fn commit(&self, message: &str, amend: bool) -> Result<String, GitError>;
    /// Creates a branch at `start`, or at `HEAD`. `switch` makes it the current branch.
    fn create_branch(&self, name: &str, start: Option<&str>, switch: bool) -> Result<(), GitError>;
    fn switch_branch(&self, name: &str) -> Result<(), GitError>;
    fn rename_branch(&self, name: &str, new_name: &str) -> Result<(), GitError>;
    /// Deletes a branch, also if it is not merged. Returns the hash of its last
    /// commit, so the branch can be made again.
    fn delete_branch(&self, name: &str) -> Result<String, GitError>;
    /// Moves each change to a new stash entry, with the untracked files. Returns its hash.
    fn stash(&self, message: &str) -> Result<String, GitError>;
    /// Applies a stash entry. The entry stays in the list.
    fn apply_stash(&self, hash: &str) -> Result<(), GitError>;
    /// Applies a stash entry and removes it from the list.
    fn pop_stash(&self, hash: &str) -> Result<(), GitError>;
    fn drop_stash(&self, hash: &str) -> Result<(), GitError>;
    /// Puts a dropped entry back in the stash list.
    fn restore_stash(&self, hash: &str, message: &str) -> Result<(), GitError>;

    // The network operations send each progress line of `git` to `progress`.

    fn add_remote(&self, name: &str, url: &str) -> Result<(), GitError>;
    /// Fetches each remote. A remote branch that the remote deleted is removed.
    fn fetch(&self, progress: &mut dyn FnMut(Progress)) -> Result<(), GitError>;
    /// Fast-forwards the current branch to its upstream. It does not merge or rebase.
    fn pull(&self, progress: &mut dyn FnMut(Progress)) -> Result<(), GitError>;
    /// Sends the commits of the current branch to its upstream.
    fn push(&self, progress: &mut dyn FnMut(Progress)) -> Result<(), GitError>;
    /// Pushes the current branch to `origin`, or to the first remote, and makes
    /// that branch its upstream. Returns the name of the upstream.
    fn publish(&self, progress: &mut dyn FnMut(Progress)) -> Result<String, GitError>;
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

/// Opens the repository that contains `path`. The network operations give
/// `token` to the HTTPS remotes of its host.
///
/// # Errors
///
/// Returns `GitError::NotARepository` if `path` is not in a repository that
/// has a working tree.
pub fn open_repo_with_token(
    path: &Path,
    token: Option<HostToken>,
) -> Result<Box<dyn GitBackend>, GitError> {
    Ok(Box::new(Git2Backend::open(path)?.with_token(token)))
}
