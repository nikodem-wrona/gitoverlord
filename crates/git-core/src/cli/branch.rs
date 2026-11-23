//! Creates, switches, renames, and deletes local branches.

use std::path::Path;

use super::run_git_in;
use crate::GitError;

/// Creates the branch `name` at `start`, or at `HEAD`. `switch` makes it the current branch.
pub(crate) fn create(
    dir: &Path,
    name: &str,
    start: Option<&str>,
    switch: bool,
) -> Result<(), GitError> {
    let mut args = if switch {
        vec!["switch", "--create", checked(name)?]
    } else {
        vec!["branch", checked(name)?]
    };
    if let Some(start) = start {
        args.push(checked(start)?);
    }
    run_git_in(dir, &args).map(drop)
}

pub(crate) fn switch(dir: &Path, name: &str) -> Result<(), GitError> {
    run_git_in(dir, &["switch", checked(name)?]).map(drop)
}

pub(crate) fn rename(dir: &Path, name: &str, new_name: &str) -> Result<(), GitError> {
    run_git_in(
        dir,
        &["branch", "--move", checked(name)?, checked(new_name)?],
    )
    .map(drop)
}

/// Deletes the branch `name`, also if another branch does not contain its commits.
pub(crate) fn delete(dir: &Path, name: &str) -> Result<(), GitError> {
    run_git_in(dir, &["branch", "--delete", "--force", checked(name)?]).map(drop)
}

/// Rejects a name that `git` would read as an option.
fn checked(name: &str) -> Result<&str, GitError> {
    if name.trim().is_empty() || name.starts_with('-') {
        return Err(GitError::Rejected(format!(
            "\"{name}\" is not a valid branch name."
        )));
    }
    Ok(name)
}

#[cfg(test)]
mod tests {
    use crate::GitError;
    use crate::fixture::RepoFixture;

    fn current(fixture: &RepoFixture) -> Option<String> {
        fixture.backend().summary().unwrap().head.branch
    }

    fn branch_names(fixture: &RepoFixture) -> Vec<String> {
        let branches = fixture.backend().branches().unwrap();
        branches.into_iter().map(|branch| branch.name).collect()
    }

    #[test]
    fn creates_a_branch_and_switches_to_it() {
        let fixture = RepoFixture::new().commit("a");

        let backend = fixture.backend();
        backend.create_branch("feature", None, true).unwrap();

        assert_eq!(current(&fixture).as_deref(), Some("feature"));
    }

    #[test]
    fn creates_a_branch_at_a_commit_without_a_switch() {
        let fixture = RepoFixture::new().commit("a").commit("b");
        let first = fixture.git(&["rev-parse", "HEAD~1"]);

        fixture
            .backend()
            .create_branch("old", Some(&first), false)
            .unwrap();

        assert_eq!(current(&fixture).as_deref(), Some("main"));
        assert_eq!(fixture.git(&["rev-parse", "old"]), first);
    }

    #[test]
    fn switches_renames_and_deletes_a_branch() {
        let fixture = RepoFixture::new().commit("a").branch("topic").commit("b");
        let backend = fixture.backend();

        backend.switch_branch("main").unwrap();
        backend.rename_branch("topic", "renamed").unwrap();
        assert_eq!(branch_names(&fixture), ["main", "renamed"]);

        let tip = backend.delete_branch("renamed").unwrap();
        assert_eq!(branch_names(&fixture), ["main"]);

        backend.create_branch("renamed", Some(&tip), false).unwrap();
        assert_eq!(fixture.git(&["log", "-1", "--format=%s", "renamed"]), "b");
    }

    #[test]
    fn rejects_a_name_that_git_would_read_as_an_option() {
        let fixture = RepoFixture::new().commit("a");

        let error = fixture.backend().switch_branch("-f").unwrap_err();

        assert!(matches!(error, GitError::Rejected(_)), "error: {error:?}");
    }

    #[test]
    fn reports_the_reason_when_git_refuses_a_switch() {
        let fixture = RepoFixture::new().commit("a");

        let error = fixture.backend().switch_branch("missing").unwrap_err();

        assert!(
            matches!(error, GitError::CommandFailed(_)),
            "error: {error:?}"
        );
    }
}
