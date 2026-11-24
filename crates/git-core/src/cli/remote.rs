//! Fetches, pulls, pushes, and clones through the system `git`.

use std::path::Path;

use super::network::run_network;
use super::run_git_in;
use crate::GitError;
use crate::model::{HostToken, Progress};

/// Fetches each remote. A remote branch that the remote deleted is removed.
pub(crate) fn fetch(
    dir: &Path,
    token: Option<&HostToken>,
    progress: &mut dyn FnMut(Progress),
) -> Result<(), GitError> {
    let args = ["fetch", "--all", "--prune", "--progress"];
    run_network(dir, &args, token, progress)
}

/// Fetches the upstream of the current branch and fast-forwards the branch.
///
/// The pull does not merge and does not rebase, also if the configuration of the user says so.
pub(crate) fn pull(
    dir: &Path,
    token: Option<&HostToken>,
    progress: &mut dyn FnMut(Progress),
) -> Result<(), GitError> {
    run_network(dir, &["pull", "--ff-only", "--progress"], token, progress)
}

/// Pushes `refspec`, for example `refs/heads/main:refs/heads/main`, to `remote`.
///
/// `track` makes the remote branch the upstream of the local branch.
pub(crate) fn push(
    dir: &Path,
    remote: &str,
    refspec: &str,
    track: bool,
    token: Option<&HostToken>,
    progress: &mut dyn FnMut(Progress),
) -> Result<(), GitError> {
    let mut args = vec!["push", "--progress"];
    if track {
        args.push("--set-upstream");
    }
    args.extend(["--", remote, refspec]);
    run_network(dir, &args, token, progress)
}

/// The change of a force push: the commit `source` replaces the branch `target` on the remote.
pub(crate) struct ForcePush<'a> {
    pub(crate) remote: &'a str,
    /// A local branch or a commit.
    pub(crate) source: &'a str,
    /// The branch on the remote, for example `refs/heads/main`.
    pub(crate) target: &'a str,
    /// The commit that the remote must have now. Else `git` refuses the push,
    /// so no commit that the user did not fetch is lost.
    pub(crate) expected: &'a str,
}

/// Replaces a branch on the remote, also when the remote has commits that `source` does not have.
pub(crate) fn force_push(
    dir: &Path,
    change: &ForcePush<'_>,
    token: Option<&HostToken>,
    progress: &mut dyn FnMut(Progress),
) -> Result<(), GitError> {
    let lease = format!("--force-with-lease={}:{}", change.target, change.expected);
    let refspec = format!("{}:{}", change.source, change.target);
    let args = ["push", "--progress", &lease, "--", change.remote, &refspec];
    run_network(dir, &args, token, progress)
}

pub(crate) fn add(dir: &Path, name: &str, url: &str) -> Result<(), GitError> {
    run_git_in(dir, &["remote", "add", "--", name, url]).map(drop)
}

/// Clones `url` into the new folder `target`.
pub(crate) fn clone(
    url: &str,
    target: &Path,
    token: Option<&HostToken>,
    progress: &mut dyn FnMut(Progress),
) -> Result<(), GitError> {
    let parent = target.parent().unwrap_or(target);
    let target = target.to_string_lossy();
    let args = ["clone", "--progress", "--", url, &target];
    run_network(parent, &args, token, progress)
}
