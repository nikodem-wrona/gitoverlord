//! Fetches, pulls, pushes, and clones through the system `git`.

use std::path::Path;

use super::network::run_network;
use super::run_git_in;
use crate::GitError;
use crate::model::Progress;

/// Fetches each remote. A remote branch that the remote deleted is removed.
pub(crate) fn fetch(dir: &Path, progress: &mut dyn FnMut(Progress)) -> Result<(), GitError> {
    run_network(dir, &["fetch", "--all", "--prune", "--progress"], progress)
}

/// Fetches the upstream of the current branch and fast-forwards the branch.
///
/// The pull does not merge and does not rebase, also if the configuration of the user says so.
pub(crate) fn pull(dir: &Path, progress: &mut dyn FnMut(Progress)) -> Result<(), GitError> {
    run_network(dir, &["pull", "--ff-only", "--progress"], progress)
}

/// Pushes `refspec`, for example `refs/heads/main:refs/heads/main`, to `remote`.
///
/// `track` makes the remote branch the upstream of the local branch.
pub(crate) fn push(
    dir: &Path,
    remote: &str,
    refspec: &str,
    track: bool,
    progress: &mut dyn FnMut(Progress),
) -> Result<(), GitError> {
    let mut args = vec!["push", "--progress"];
    if track {
        args.push("--set-upstream");
    }
    args.extend(["--", remote, refspec]);
    run_network(dir, &args, progress)
}

pub(crate) fn add(dir: &Path, name: &str, url: &str) -> Result<(), GitError> {
    run_git_in(dir, &["remote", "add", "--", name, url]).map(drop)
}

/// Clones `url` into the new folder `target`.
pub(crate) fn clone(
    url: &str,
    target: &Path,
    progress: &mut dyn FnMut(Progress),
) -> Result<(), GitError> {
    let parent = target.parent().unwrap_or(target);
    let target = target.to_string_lossy();
    run_network(
        parent,
        &["clone", "--progress", "--", url, &target],
        progress,
    )
}
