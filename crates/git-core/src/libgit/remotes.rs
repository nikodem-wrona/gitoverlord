//! Reads the remotes, and the upstream of the current branch.

use std::fs;
use std::time::UNIX_EPOCH;

use git2::{BranchType, Repository};

use super::lossy;
use crate::GitError;
use crate::model::Remote;

/// The remote that a branch without an upstream goes to, when it exists.
const DEFAULT_REMOTE: &str = "origin";

/// The remote branch that a local branch follows.
pub(super) struct Upstream {
    pub(super) remote: String,
    /// The branch on the remote, for example `refs/heads/main`.
    pub(super) merge: String,
}

pub(super) fn read(repo: &Repository) -> Result<Vec<Remote>, GitError> {
    let tracking = remote_branches(repo)?;
    let remotes = remote_names(repo)?.into_iter().map(|name| {
        let found = repo.find_remote(&name).ok();
        let url = found.map(|remote| without_credentials(&lossy(remote.url_bytes())));
        let prefix = format!("{name}/");
        let branches = tracking.iter().filter(|branch| branch.starts_with(&prefix));
        Remote {
            branches: branches.cloned().collect(),
            url: url.filter(|url| !url.is_empty()),
            name,
        }
    });
    Ok(remotes.collect())
}

/// Returns the name of the current branch. Rejects a detached `HEAD` and a branch without commits.
pub(super) fn current_branch(repo: &Repository) -> Result<String, GitError> {
    let reject = || GitError::Rejected("Switch to a branch that has a commit.".to_owned());
    let head = repo.head().map_err(|_| reject())?;
    if !head.is_branch() {
        return Err(reject());
    }
    Ok(lossy(head.shorthand_bytes()))
}

/// Returns the upstream of the local branch `branch`, or `None`.
pub(super) fn upstream(repo: &Repository, branch: &str) -> Option<Upstream> {
    let name = format!("refs/heads/{branch}");
    let remote = repo.branch_upstream_remote(&name).ok()?;
    let merge = repo.branch_upstream_merge(&name).ok()?;
    Some(Upstream {
        remote: lossy(&remote),
        merge: lossy(&merge),
    })
}

/// Returns `origin`, or else the first remote.
pub(super) fn default_remote(repo: &Repository) -> Result<String, GitError> {
    let names = remote_names(repo)?;
    let remote = names.iter().find(|name| *name == DEFAULT_REMOTE);
    let remote = remote.or_else(|| names.first()).cloned();
    remote.ok_or_else(|| GitError::Rejected("The repository has no remote.".to_owned()))
}

/// Returns `true` when both the branch and its upstream have commits that the other does not have.
pub(super) fn diverged(repo: &Repository, branch: &str) -> Result<bool, GitError> {
    let local = repo.find_branch(branch, BranchType::Local)?;
    let upstream = local.upstream()?;
    let (Some(tip), Some(target)) = (local.get().target(), upstream.get().target()) else {
        return Ok(false);
    };
    let (ahead, behind) = repo.graph_ahead_behind(tip, target)?;
    Ok(ahead > 0 && behind > 0)
}

/// The time of the last fetch, in Unix seconds. Each fetch writes `FETCH_HEAD`.
pub(super) fn last_fetch(repo: &Repository) -> Option<i64> {
    let modified = fs::metadata(repo.path().join("FETCH_HEAD"))
        .ok()?
        .modified()
        .ok()?;
    let seconds = modified.duration_since(UNIX_EPOCH).ok()?.as_secs();
    i64::try_from(seconds).ok()
}

/// The names of the remotes, in alphabetical order.
pub(super) fn remote_names(repo: &Repository) -> Result<Vec<String>, GitError> {
    let mut names: Vec<String> = repo.remotes()?.iter_bytes().map(lossy).collect();
    names.sort();
    Ok(names)
}

/// The names of the remote branches, for example `origin/main`. `origin/HEAD` is not included.
fn remote_branches(repo: &Repository) -> Result<Vec<String>, GitError> {
    let mut names = Vec::new();
    for entry in repo.branches(Some(BranchType::Remote))? {
        let (branch, _) = entry?;
        let name = lossy(branch.name_bytes()?);
        if !name.ends_with("/HEAD") {
            names.push(name);
        }
    }
    names.sort();
    Ok(names)
}

/// Removes the user name and the password from an HTTP URL, for example a token.
fn without_credentials(url: &str) -> String {
    let Some((scheme, rest)) = url.split_once("://") else {
        return url.to_owned();
    };
    let host_end = rest.find('/').unwrap_or(rest.len());
    match rest[..host_end].rfind('@') {
        Some(at) if scheme.starts_with("http") => format!("{scheme}://{}", &rest[at + 1..]),
        _ => url.to_owned(),
    }
}

#[cfg(test)]
mod tests {
    use super::without_credentials;
    use crate::fixture::RepoFixture;

    #[test]
    fn lists_the_remotes_with_their_branches() {
        let fixture = RepoFixture::new().commit("a").with_origin();
        fixture.git(&["push", "--quiet", "origin", "main"]);
        fixture.git(&["remote", "add", "backup", "https://example.com/backup.git"]);

        let remotes = fixture.backend().remotes().unwrap();

        let names: Vec<_> = remotes.iter().map(|remote| remote.name.as_str()).collect();
        assert_eq!(names, ["backup", "origin"]);
        assert_eq!(
            remotes[0].url.as_deref(),
            Some("https://example.com/backup.git")
        );
        assert!(remotes[0].branches.is_empty());
        assert_eq!(remotes[1].branches, ["origin/main"]);
    }

    #[test]
    fn hides_the_credentials_in_an_http_url() {
        let cases = [
            (
                "https://user:token@example.com/a.git",
                "https://example.com/a.git",
            ),
            (
                "https://token@example.com/a@b.git",
                "https://example.com/a@b.git",
            ),
            ("ssh://git@example.com/a.git", "ssh://git@example.com/a.git"),
            ("git@example.com:owner/a.git", "git@example.com:owner/a.git"),
        ];
        for (url, shown) in cases {
            assert_eq!(without_credentials(url), shown, "{url}");
        }
    }
}
