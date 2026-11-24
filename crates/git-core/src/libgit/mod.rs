//! The backend. It reads repositories with libgit2 and changes them with the system `git`.

mod activity;
mod branches;
mod conflict;
mod delta;
mod detail;
mod diff;
mod discard;
mod hunk;
mod log;
mod operation;
mod refs;
mod remotes;
mod stash;
mod status;
mod summary;
mod surgery;
#[cfg(test)]
mod surgery_tests;
mod sync;

use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use git2::Repository;

use crate::cli::sequence::{self, Step};
use crate::cli::{branch, commit, remote, resolve, stage, stash as stash_cli};
use crate::model::{
    Branch, CommitDetail, ConflictFile, DiffTarget, FileDiff, HostToken, HunkTarget, LogPage,
    OperationResult, Progress, Remote, RepoSummary, ResetMode, ResetReceipt, Resolution,
    StashEntry, WorkingTree,
};
use crate::{GitBackend, GitError};

pub(crate) struct Git2Backend {
    repo: Repository,
    /// The working tree. Each `git` process runs in this folder.
    dir: PathBuf,
    /// Signs in to the HTTPS remotes of one host in the network operations.
    token: Option<HostToken>,
}

impl Git2Backend {
    pub(crate) fn open(path: &Path) -> Result<Self, GitError> {
        let repo = open_repository(path)?;
        let dir = summary::workdir(&repo)?;
        Ok(Self {
            repo,
            dir,
            token: None,
        })
    }

    pub(crate) fn with_token(mut self, token: Option<HostToken>) -> Self {
        self.token = token;
        self
    }

    /// Moves one hunk to the index, or out of the index when `staged` is `true`.
    fn move_hunk(&self, target: &HunkTarget, staged: bool) -> Result<(), GitError> {
        let patch = hunk::patch(&self.repo, target, staged)?;
        stage::apply_to_index(&self.dir, &patch, staged)
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

    fn stashes(&self) -> Result<Vec<StashEntry>, GitError> {
        stash::read(&self.repo)
    }

    fn remotes(&self) -> Result<Vec<Remote>, GitError> {
        remotes::read(&self.repo)
    }

    fn stage(&self, paths: &[String]) -> Result<(), GitError> {
        stage::add(&self.dir, paths)
    }

    fn unstage(&self, paths: &[String]) -> Result<(), GitError> {
        stage::reset(&self.dir, paths, status::is_unborn(&self.repo)?)
    }

    fn stage_hunk(&self, target: &HunkTarget) -> Result<(), GitError> {
        self.move_hunk(target, false)
    }

    fn unstage_hunk(&self, target: &HunkTarget) -> Result<(), GitError> {
        self.move_hunk(target, true)
    }

    fn discard(&self, paths: &[String]) -> Result<String, GitError> {
        discard::discard(&self.repo, &self.dir, paths)
    }

    fn restore_discarded(&self, hash: &str) -> Result<(), GitError> {
        discard::restore(&self.repo, &self.dir, hash)
    }

    fn commit(&self, message: &str, amend: bool) -> Result<String, GitError> {
        commit::commit(&self.dir, message, amend)?;
        Ok(self.repo.refname_to_id("HEAD")?.to_string())
    }

    fn create_branch(&self, name: &str, start: Option<&str>, switch: bool) -> Result<(), GitError> {
        branch::create(&self.dir, name, start, switch)
    }

    fn switch_branch(&self, name: &str) -> Result<(), GitError> {
        branch::switch(&self.dir, name)
    }

    fn rename_branch(&self, name: &str, new_name: &str) -> Result<(), GitError> {
        branch::rename(&self.dir, name, new_name)
    }

    fn delete_branch(&self, name: &str) -> Result<String, GitError> {
        let tip = branches::tip(&self.repo, name)?;
        branch::delete(&self.dir, name)?;
        Ok(tip)
    }

    fn stash(&self, message: &str) -> Result<String, GitError> {
        let save = || stash_cli::save(&self.dir, message);
        stash::saved(&self.repo, save, "There are no changes to stash.")
    }

    fn apply_stash(&self, hash: &str) -> Result<(), GitError> {
        stash_cli::apply(&self.dir, stash::position(&self.repo, hash)?)
    }

    fn pop_stash(&self, hash: &str) -> Result<(), GitError> {
        stash_cli::pop(&self.dir, stash::position(&self.repo, hash)?)
    }

    fn drop_stash(&self, hash: &str) -> Result<(), GitError> {
        stash_cli::drop_entry(&self.dir, stash::position(&self.repo, hash)?)
    }

    fn restore_stash(&self, hash: &str, message: &str) -> Result<(), GitError> {
        let id = stash::parse(hash)?;
        stash_cli::store(&self.dir, &id.to_string(), message)
    }

    fn merge(&self, target: &str) -> Result<OperationResult, GitError> {
        surgery::start(&self.repo, || sequence::merge(&self.dir, target))
    }

    fn rebase(&self, onto: &str) -> Result<OperationResult, GitError> {
        surgery::start(&self.repo, || sequence::rebase(&self.dir, onto))
    }

    fn cherry_pick(&self, hash: &str) -> Result<OperationResult, GitError> {
        surgery::cherry_pick(&self.repo, &self.dir, hash)
    }

    fn revert(&self, hash: &str) -> Result<OperationResult, GitError> {
        surgery::revert(&self.repo, &self.dir, hash)
    }

    fn continue_operation(&self) -> Result<OperationResult, GitError> {
        surgery::step(&self.repo, &self.dir, Step::Continue)
    }

    fn skip_operation(&self) -> Result<OperationResult, GitError> {
        surgery::step(&self.repo, &self.dir, Step::Skip)
    }

    fn abort_operation(&self) -> Result<(), GitError> {
        surgery::abort(&self.repo, &self.dir)
    }

    fn reset(&self, hash: &str, mode: ResetMode) -> Result<ResetReceipt, GitError> {
        surgery::reset(&self.repo, &self.dir, hash, mode)
    }

    fn undo_reset(&self, receipt: &ResetReceipt) -> Result<(), GitError> {
        surgery::undo_reset(&self.repo, &self.dir, receipt)
    }

    fn restore_head(&self, hash: &str) -> Result<(), GitError> {
        surgery::restore_head(&self.repo, &self.dir, hash)
    }

    fn conflict_file(&self, path: &str) -> Result<ConflictFile, GitError> {
        conflict::read(&self.repo, &self.dir, path)
    }

    fn resolve_conflict(&self, path: &str, resolution: &Resolution) -> Result<(), GitError> {
        conflict::resolve(&self.repo, &self.dir, path, resolution)
    }

    fn restore_conflict(&self, path: &str) -> Result<(), GitError> {
        resolve::restore(&self.dir, &[path.to_owned()])
    }

    fn add_remote(&self, name: &str, url: &str) -> Result<(), GitError> {
        remote::add(&self.dir, name, url)
    }

    fn fetch(&self, progress: &mut dyn FnMut(Progress)) -> Result<(), GitError> {
        sync::fetch(&self.repo, &self.dir, self.token.as_ref(), progress)
    }

    fn pull(&self, progress: &mut dyn FnMut(Progress)) -> Result<(), GitError> {
        sync::pull(&self.repo, &self.dir, self.token.as_ref(), progress)
    }

    fn push(&self, progress: &mut dyn FnMut(Progress)) -> Result<(), GitError> {
        sync::push(&self.repo, &self.dir, self.token.as_ref(), progress)
    }

    fn publish(&self, progress: &mut dyn FnMut(Progress)) -> Result<String, GitError> {
        sync::publish(&self.repo, &self.dir, self.token.as_ref(), progress)
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
