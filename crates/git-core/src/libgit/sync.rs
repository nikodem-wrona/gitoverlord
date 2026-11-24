//! Fetches the remotes, and pulls, pushes, and publishes the current branch.

use std::path::Path;

use git2::Repository;

use super::remotes::{self, Upstream};
use crate::GitError;
use crate::cli::remote::{self, ForcePush};
use crate::model::{HostToken, Progress};

pub(super) fn fetch(
    repo: &Repository,
    dir: &Path,
    token: Option<&HostToken>,
    progress: &mut dyn FnMut(Progress),
) -> Result<(), GitError> {
    if remotes::remote_names(repo)?.is_empty() {
        return Err(GitError::Rejected(
            "The repository has no remote.".to_owned(),
        ));
    }
    remote::fetch(dir, token, progress)
}

/// Fast-forwards the current branch to its upstream. A branch with its own new commits stays.
pub(super) fn pull(
    repo: &Repository,
    dir: &Path,
    token: Option<&HostToken>,
    progress: &mut dyn FnMut(Progress),
) -> Result<(), GitError> {
    let (branch, _) = tracked_branch(repo)?;
    remote::pull(dir, token, progress).map_err(|error| match remotes::diverged(repo, &branch) {
        Ok(true) => GitError::Rejected(format!(
            "The branch {branch} and its upstream both have new commits. \
             A pull only fast-forwards. Merge the upstream into the branch, or rebase the branch on it."
        )),
        _ => error,
    })
}

/// Sends the commits of the current branch to its upstream.
pub(super) fn push(
    repo: &Repository,
    dir: &Path,
    token: Option<&HostToken>,
    progress: &mut dyn FnMut(Progress),
) -> Result<(), GitError> {
    let (branch, upstream) = remote_branch(repo)?;
    let refspec = format!("refs/heads/{branch}:{}", upstream.merge);
    remote::push(dir, &upstream.remote, &refspec, false, token, progress)
}

/// Replaces the upstream of the current branch with the branch, for example after a rebase.
///
/// Returns the commit that the upstream had, for the undo. `git` refuses the push
/// when the remote changed after the last fetch.
pub(super) fn force_push(
    repo: &Repository,
    dir: &Path,
    token: Option<&HostToken>,
    progress: &mut dyn FnMut(Progress),
) -> Result<String, GitError> {
    let (branch, upstream) = remote_branch(repo)?;
    let previous = remotes::upstream_tip(repo, &branch)?;
    let change = ForcePush {
        remote: &upstream.remote,
        source: &format!("refs/heads/{branch}"),
        target: &upstream.merge,
        expected: &previous,
    };
    remote::force_push(dir, &change, token, progress)?;
    Ok(previous)
}

/// Puts the commit `previous` back on the upstream after a force push.
pub(super) fn undo_force_push(
    repo: &Repository,
    dir: &Path,
    previous: &str,
    token: Option<&HostToken>,
    progress: &mut dyn FnMut(Progress),
) -> Result<(), GitError> {
    let (branch, upstream) = remote_branch(repo)?;
    let source = repo
        .find_commit(git2::Oid::from_str(previous)?)?
        .id()
        .to_string();
    let change = ForcePush {
        remote: &upstream.remote,
        source: &source,
        target: &upstream.merge,
        expected: &remotes::upstream_tip(repo, &branch)?,
    };
    remote::force_push(dir, &change, token, progress)
}

/// Returns the current branch and its upstream on a remote. Rejects a local upstream.
fn remote_branch(repo: &Repository) -> Result<(String, Upstream), GitError> {
    let (branch, upstream) = tracked_branch(repo)?;
    if upstream.remote == "." {
        return Err(GitError::Rejected(format!(
            "The upstream of {branch} is a local branch. Push it to a remote."
        )));
    }
    Ok((branch, upstream))
}

/// Pushes the current branch to `origin`, or to the first remote, and makes it the upstream.
///
/// Returns the name of the upstream, for example `origin/main`.
pub(super) fn publish(
    repo: &Repository,
    dir: &Path,
    token: Option<&HostToken>,
    progress: &mut dyn FnMut(Progress),
) -> Result<String, GitError> {
    let branch = remotes::current_branch(repo)?;
    let remote = remotes::default_remote(repo)?;
    let refspec = format!("refs/heads/{branch}:refs/heads/{branch}");
    remote::push(dir, &remote, &refspec, true, token, progress)?;
    Ok(format!("{remote}/{branch}"))
}

/// Returns the current branch and its upstream. Rejects a branch without an upstream.
fn tracked_branch(repo: &Repository) -> Result<(String, Upstream), GitError> {
    let branch = remotes::current_branch(repo)?;
    match remotes::upstream(repo, &branch) {
        Some(upstream) => Ok((branch, upstream)),
        None => Err(GitError::Rejected(format!(
            "The branch {branch} has no upstream. Publish the branch first."
        ))),
    }
}

#[cfg(test)]
mod tests {
    use crate::fixture::RepoFixture;
    use crate::{GitBackend, GitError};

    fn ignore(_: crate::Progress) {}

    /// A repository with the branch `main` on `origin`.
    fn published() -> RepoFixture {
        let fixture = RepoFixture::new().commit("a").with_origin();
        fixture.backend().publish(&mut ignore).unwrap();
        fixture
    }

    /// Adds a commit to `main` on the origin from a second repository.
    fn push_elsewhere(fixture: &RepoFixture, message: &str) {
        let origin = fixture.origin();
        let origin = origin.to_str().unwrap();
        let other = RepoFixture::new();
        other.git(&["pull", "--quiet", origin, "main"]);
        let other = other.commit(message);
        other.git(&["push", "--quiet", origin, "HEAD:main"]);
    }

    fn current_counts(backend: &dyn GitBackend) -> (u32, u32) {
        let branch = &backend.branches().unwrap()[0];
        (branch.ahead, branch.behind)
    }

    #[test]
    fn publishes_the_branch_and_reports_the_progress() {
        let fixture = RepoFixture::new().commit("a").with_origin();
        let mut steps = Vec::new();

        let upstream = fixture.backend().publish(&mut |step| steps.push(step));

        assert_eq!(upstream.unwrap(), "origin/main");
        assert!(!steps.is_empty());
        let branch = &fixture.backend().branches().unwrap()[0];
        assert_eq!(branch.upstream.as_deref(), Some("origin/main"));
    }

    #[test]
    fn pushes_the_new_commits_to_the_upstream() {
        let fixture = published().commit("b");
        assert_eq!(current_counts(fixture.backend().as_ref()), (1, 0));

        fixture.backend().push(&mut ignore).unwrap();

        let remote_tip = fixture.git(&["ls-remote", "origin", "refs/heads/main"]);
        assert!(remote_tip.starts_with(&fixture.git(&["rev-parse", "HEAD"])));
        assert_eq!(current_counts(fixture.backend().as_ref()), (0, 0));
    }

    #[test]
    fn fetches_and_then_pulls_the_new_commits() {
        let fixture = published();
        push_elsewhere(&fixture, "c");
        let backend = fixture.backend();

        backend.fetch(&mut ignore).unwrap();
        assert_eq!(current_counts(backend.as_ref()), (0, 1));
        assert!(backend.summary().unwrap().fetched.is_some());
        backend.pull(&mut ignore).unwrap();

        assert_eq!(current_counts(backend.as_ref()), (0, 0));
        assert_eq!(fixture.git(&["log", "-1", "--format=%s"]), "c");
    }

    #[test]
    fn rejects_a_pull_that_cannot_fast_forward() {
        let fixture = published();
        push_elsewhere(&fixture, "c");
        // The pull must not rebase, also when the configuration says so.
        fixture.git(&["config", "pull.rebase", "true"]);
        let fixture = fixture.commit("d");

        let error = fixture.backend().pull(&mut ignore).unwrap_err();

        assert!(matches!(error, GitError::Rejected(_)), "error: {error:?}");
        assert_eq!(fixture.git(&["log", "-1", "--format=%s"]), "d");
    }

    #[test]
    fn force_pushes_a_rewritten_branch_and_the_undo_puts_the_old_commit_back() {
        let fixture = published().commit("b");
        fixture.backend().push(&mut ignore).unwrap();
        let old = fixture.git(&["rev-parse", "HEAD"]);
        fixture.git(&["commit", "--amend", "--quiet", "--message", "b2"]);
        let backend = fixture.backend();
        assert_eq!(current_counts(backend.as_ref()), (1, 1));

        let previous = backend.force_push(&mut ignore).unwrap();

        assert_eq!(previous, old);
        assert_eq!(current_counts(backend.as_ref()), (0, 0));
        backend.undo_force_push(&previous, &mut ignore).unwrap();
        let remote_tip = fixture.git(&["ls-remote", "origin", "refs/heads/main"]);
        assert!(remote_tip.starts_with(&old), "remote: {remote_tip}");
    }

    #[test]
    fn refuses_a_force_push_over_commits_that_were_not_fetched() {
        let fixture = published();
        push_elsewhere(&fixture, "c");
        let fixture = fixture.commit("d");

        let result = fixture.backend().force_push(&mut ignore);

        assert!(result.is_err());
        let remote_log = fixture.git(&["log", "-1", "--format=%s", "origin/main"]);
        assert_eq!(remote_log, "a");
    }

    #[test]
    fn rejects_a_push_without_an_upstream() {
        let fixture = RepoFixture::new().commit("a").with_origin();

        let error = fixture.backend().push(&mut ignore).unwrap_err();

        assert!(matches!(error, GitError::Rejected(_)), "error: {error:?}");
    }

    #[test]
    fn rejects_a_detached_head_and_a_repository_without_remotes() {
        let fixture = RepoFixture::new().commit("a").commit("b");
        let backend = fixture.backend();
        assert!(matches!(
            backend.fetch(&mut ignore),
            Err(GitError::Rejected(_))
        ));
        assert!(matches!(
            backend.publish(&mut ignore),
            Err(GitError::Rejected(_))
        ));

        fixture.git(&["switch", "--quiet", "--detach", "HEAD~1"]);

        assert!(matches!(
            backend.pull(&mut ignore),
            Err(GitError::Rejected(_))
        ));
    }
}
