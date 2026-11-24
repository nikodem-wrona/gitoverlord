//! Records the staged changes as a commit.

use std::path::Path;

use super::run_git_in;
use crate::GitError;

/// Commits the staged changes with `message`.
///
/// `amend` replaces the last commit. An amend with an empty message keeps the old message.
pub(crate) fn commit(dir: &Path, message: &str, amend: bool) -> Result<(), GitError> {
    let mut args = vec!["commit"];
    if amend {
        args.push("--amend");
    }
    if amend && message.trim().is_empty() {
        args.push("--no-edit");
    } else {
        args.extend(["--message", message]);
    }
    run_git_in(dir, &args).map(drop)
}

#[cfg(test)]
mod tests {
    use crate::GitError;
    use crate::fixture::RepoFixture;

    fn subjects(fixture: &RepoFixture) -> Vec<String> {
        let page = fixture.backend().log(0, 10).unwrap();
        page.commits
            .into_iter()
            .map(|commit| commit.subject)
            .collect()
    }

    #[test]
    fn commits_the_staged_changes_and_returns_the_new_hash() {
        let fixture = RepoFixture::new()
            .commit("a")
            .write("b.txt", "b\n")
            .stage("b.txt");

        let hash = fixture
            .backend()
            .commit("add b\n\nThe body.", false)
            .unwrap();

        assert_eq!(hash, fixture.git(&["rev-parse", "HEAD"]));
        assert_eq!(subjects(&fixture), ["add b", "a"]);
        assert!(fixture.backend().status().unwrap().staged.is_empty());
    }

    #[test]
    fn amends_the_last_commit() {
        let fixture = RepoFixture::new()
            .commit("a")
            .write("b.txt", "b\n")
            .stage("b.txt");

        fixture.backend().commit("a and b", true).unwrap();

        assert_eq!(subjects(&fixture), ["a and b"]);
    }

    #[test]
    fn keeps_the_message_of_an_amend_without_a_message() {
        let fixture = RepoFixture::new()
            .commit("a")
            .write("b.txt", "b\n")
            .stage("b.txt");

        fixture.backend().commit("  ", true).unwrap();

        assert_eq!(subjects(&fixture), ["a"]);
        assert!(fixture.git(&["show", "--stat", "HEAD"]).contains("b.txt"));
    }

    #[test]
    fn reports_the_reason_when_there_is_nothing_to_commit() {
        let fixture = RepoFixture::new().commit("a");

        let error = fixture.backend().commit("empty", false).unwrap_err();

        let GitError::CommandFailed(message) = error else {
            panic!("expected CommandFailed, got {error:?}");
        };
        assert!(message.contains("nothing"), "message: {message}");
    }
}
