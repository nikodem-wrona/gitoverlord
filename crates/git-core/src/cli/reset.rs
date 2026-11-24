//! Moves the current branch to another commit.

use std::path::Path;

use super::run_git_in;
use crate::GitError;
use crate::model::ResetMode;

/// Moves the current branch, or a detached `HEAD`, to `hash`.
pub(crate) fn reset(dir: &Path, hash: &str, mode: ResetMode) -> Result<(), GitError> {
    let flag = match mode {
        ResetMode::Soft => "--soft",
        ResetMode::Mixed => "--mixed",
        ResetMode::Hard => "--hard",
    };
    run_git_in(dir, &["reset", "--quiet", flag, hash]).map(drop)
}

/// Moves the current branch to `hash` and keeps the uncommitted changes.
///
/// `git` refuses when a file with uncommitted changes is different in `hash`,
/// so no change is lost.
pub(crate) fn keep(dir: &Path, hash: &str) -> Result<(), GitError> {
    run_git_in(dir, &["reset", "--quiet", "--keep", hash]).map(drop)
}
