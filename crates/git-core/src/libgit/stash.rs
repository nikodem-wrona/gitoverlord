//! Reads the stash list from the log of `refs/stash`.

use git2::{Oid, Repository};

use super::{count, lossy};
use crate::GitError;
use crate::model::StashEntry;

const STASH_REF: &str = "refs/stash";

/// Lists the entries. The newest entry is first.
pub(super) fn read(repo: &Repository) -> Result<Vec<StashEntry>, GitError> {
    let log = repo.reflog(STASH_REF)?;
    let entries = log.iter().enumerate().map(|(index, entry)| StashEntry {
        index: count(index),
        hash: entry.id_new().to_string(),
        message: entry.message_bytes().map(lossy).unwrap_or_default(),
        time: entry.committer().when().seconds(),
    });
    Ok(entries.collect())
}

/// Finds the position of the entry `hash` in the list.
pub(super) fn position(repo: &Repository, hash: &str) -> Result<usize, GitError> {
    let id = parse(hash)?;
    let log = repo.reflog(STASH_REF)?;
    log.iter()
        .position(|entry| entry.id_new() == id)
        .ok_or_else(|| GitError::Rejected("The stash entry is no longer in the list.".into()))
}

/// Reads a hash. Other text is rejected, so `git` cannot read it as an option.
pub(super) fn parse(hash: &str) -> Result<Oid, GitError> {
    Oid::from_str(hash).map_err(|_| GitError::Rejected(format!("\"{hash}\" is not a hash.")))
}

/// Runs `save`, then returns the hash of the entry that it added.
///
/// `git stash` does not fail when there is nothing to save. Then `nothing` is the error.
pub(super) fn saved(
    repo: &Repository,
    save: impl FnOnce() -> Result<(), GitError>,
    nothing: &str,
) -> Result<String, GitError> {
    let before = repo.reflog(STASH_REF)?.len();
    save()?;
    if repo.reflog(STASH_REF)?.len() <= before {
        return Err(GitError::Rejected(nothing.to_owned()));
    }
    Ok(repo.refname_to_id(STASH_REF)?.to_string())
}

#[cfg(test)]
mod tests {
    use crate::GitError;
    use crate::fixture::RepoFixture;

    fn messages(fixture: &RepoFixture) -> Vec<String> {
        let entries = fixture.backend().stashes().unwrap();
        entries.into_iter().map(|entry| entry.message).collect()
    }

    #[test]
    fn lists_no_entries_in_a_new_repository() {
        assert!(messages(&RepoFixture::new().commit("a")).is_empty());
    }

    #[test]
    fn saves_the_changes_with_untracked_files_and_lists_the_newest_entry_first() {
        let fixture = RepoFixture::new().commit("a").write("a.txt", "first\n");
        let backend = fixture.backend();
        backend.stash("first").unwrap();
        std::fs::write(fixture.path().join("new.txt"), "second\n").unwrap();

        let hash = backend.stash("second").unwrap();

        assert_eq!(messages(&fixture), ["On main: second", "On main: first"]);
        assert_eq!(backend.stashes().unwrap()[0].hash, hash);
        assert!(backend.status().unwrap().unstaged.is_empty());
    }

    #[test]
    fn rejects_a_stash_without_changes() {
        let fixture = RepoFixture::new().commit("a");

        let error = fixture.backend().stash("").unwrap_err();

        assert!(matches!(error, GitError::Rejected(_)), "error: {error:?}");
    }

    #[test]
    fn applies_pops_drops_and_restores_an_entry() {
        let fixture = RepoFixture::new().commit("a").write("a.txt", "work\n");
        let backend = fixture.backend();
        let hash = backend.stash("work").unwrap();

        backend.apply_stash(&hash).unwrap();
        assert_eq!(messages(&fixture).len(), 1);
        fixture.git(&["checkout", "--", "a.txt"]);

        backend.drop_stash(&hash).unwrap();
        assert!(messages(&fixture).is_empty());

        backend.restore_stash(&hash, "On main: work").unwrap();
        backend.pop_stash(&hash).unwrap();
        assert!(messages(&fixture).is_empty());
        assert_eq!(fixture.git(&["diff", "--name-only"]), "a.txt");
    }

    #[test]
    fn rejects_an_entry_that_is_not_in_the_list() {
        let fixture = RepoFixture::new().commit("a");
        let head = fixture.git(&["rev-parse", "HEAD"]);

        let missing = fixture.backend().pop_stash(&head).unwrap_err();
        let invalid = fixture.backend().drop_stash("--all").unwrap_err();

        assert!(matches!(missing, GitError::Rejected(_)), "{missing:?}");
        assert!(matches!(invalid, GitError::Rejected(_)), "{invalid:?}");
    }
}
