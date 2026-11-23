//! The backend that reads repositories with libgit2.

mod activity;
mod branches;
mod delta;
mod detail;
mod diff;
mod log;
mod refs;
mod status;
mod summary;

use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use git2::Repository;

use crate::model::{Branch, CommitDetail, DiffTarget, FileDiff, LogPage, RepoSummary, WorkingTree};
use crate::{GitBackend, GitError};

pub(crate) struct Git2Backend {
    repo: Repository,
}

impl Git2Backend {
    pub(crate) fn open(path: &Path) -> Result<Self, GitError> {
        Ok(Self {
            repo: open_repository(path)?,
        })
    }
}

/// Finds the repository that contains `path`. A bare repository is not accepted.
pub(crate) fn open_repository(path: &Path) -> Result<Repository, GitError> {
    let not_a_repository = || GitError::NotARepository(path.display().to_string());
    let repo = Repository::discover(path).map_err(|_| not_a_repository())?;
    if repo.workdir().is_none() {
        return Err(not_a_repository());
    }
    Ok(repo)
}

impl GitBackend for Git2Backend {
    fn summary(&self) -> Result<RepoSummary, GitError> {
        summary::read(&self.repo)
    }

    fn status(&self) -> Result<WorkingTree, GitError> {
        status::read(&self.repo)
    }

    fn log(&self, skip: u32, limit: u32) -> Result<LogPage, GitError> {
        log::read(&self.repo, skip, limit)
    }

    fn branches(&self) -> Result<Vec<Branch>, GitError> {
        branches::read(&self.repo)
    }

    fn commit_detail(&self, hash: &str) -> Result<CommitDetail, GitError> {
        detail::read(&self.repo, hash)
    }

    fn file_diff(&self, target: &DiffTarget) -> Result<FileDiff, GitError> {
        diff::read(&self.repo, target)
    }

    fn activity(&self, days: u32) -> Result<Vec<u32>, GitError> {
        activity::read(&self.repo, days, unix_now())
    }
}

fn unix_now() -> i64 {
    let elapsed = SystemTime::now().duration_since(UNIX_EPOCH);
    elapsed.map_or(0, |duration| {
        i64::try_from(duration.as_secs()).unwrap_or(i64::MAX)
    })
}

/// Reads text from git. A byte sequence that is not UTF-8 gets replacement characters.
fn lossy(bytes: &[u8]) -> String {
    String::from_utf8_lossy(bytes).into_owned()
}

/// Converts a count to the integer type of the model.
fn count(value: usize) -> u32 {
    u32::try_from(value).unwrap_or(u32::MAX)
}
