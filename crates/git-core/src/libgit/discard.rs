//! Discards the unstaged changes of files.
//!
//! A stash entry keeps a copy of the changes, so the user can restore them.

use std::path::Path;

use git2::{ObjectType, Repository, Tree, TreeWalkMode, TreeWalkResult};

use super::{lossy, stash, status};
use crate::GitError;
use crate::cli::{stage, stash as stash_cli};
use crate::model::ChangeKind;

const NOTHING: &str = "There are no changes to discard.";
const SHOWN_PATHS: usize = 3;

/// Removes the unstaged changes of `paths` and returns the hash of the stash entry.
///
/// The staged changes of `paths` stay in the index.
pub(super) fn discard(repo: &Repository, dir: &Path, paths: &[String]) -> Result<String, GitError> {
    let (kept, deleted) = staged_paths(repo, paths)?;
    let save = || stash_cli::save_paths(dir, &message(paths), paths);
    let hash = stash::saved(repo, save, NOTHING)?;
    // The stash also took the staged changes. They come back from its index commit.
    stage::restore(dir, &format!("{hash}^2"), &kept, true)?;
    stage::remove(dir, &deleted)?;
    Ok(hash)
}

/// Writes the files of the discard `hash` back to the working tree, then drops the entry.
pub(super) fn restore(repo: &Repository, dir: &Path, hash: &str) -> Result<(), GitError> {
    let index = stash::position(repo, hash)?;
    let commit = repo.find_commit(stash::parse(hash)?)?;
    let tracked = changed_paths(repo, &commit.parent(1)?.tree()?, &commit.tree()?)?;
    stage::restore(dir, hash, &tracked, false)?;
    // The third parent holds the untracked files.
    if let Ok(untracked) = commit.parent(2) {
        let files = tree_files(&untracked.tree()?)?;
        stage::restore(dir, &untracked.id().to_string(), &files, false)?;
    }
    stash_cli::drop_entry(dir, index)
}

/// Splits the staged files in `paths` into the files that stay and the deleted files.
fn staged_paths(
    repo: &Repository,
    paths: &[String],
) -> Result<(Vec<String>, Vec<String>), GitError> {
    let (mut kept, mut deleted) = (Vec::new(), Vec::new());
    for file in status::read(repo)?.staged {
        if let Some(old) = file.old_path.filter(|old| paths.contains(old)) {
            deleted.push(old);
        }
        if !paths.contains(&file.path) {
            continue;
        }
        match file.kind {
            ChangeKind::Deleted => deleted.push(file.path),
            _ => kept.push(file.path),
        }
    }
    Ok((kept, deleted))
}

fn message(paths: &[String]) -> String {
    let shown = paths[..paths.len().min(SHOWN_PATHS)].join(", ");
    match paths.len().saturating_sub(SHOWN_PATHS) {
        0 => format!("Discarded by gitoverlord: {shown}"),
        more => format!("Discarded by gitoverlord: {shown} and {more} more"),
    }
}

fn changed_paths(
    repo: &Repository,
    old: &Tree<'_>,
    new: &Tree<'_>,
) -> Result<Vec<String>, GitError> {
    let diff = repo.diff_tree_to_tree(Some(old), Some(new), None)?;
    let paths = diff.deltas().filter_map(|delta| {
        let path = delta.new_file().path().or_else(|| delta.old_file().path());
        path.map(|path| path.to_string_lossy().into_owned())
    });
    Ok(paths.collect())
}

/// Lists each file in `tree` and in its folders.
fn tree_files(tree: &Tree<'_>) -> Result<Vec<String>, GitError> {
    let mut files = Vec::new();
    tree.walk(TreeWalkMode::PreOrder, |folder, entry| {
        if entry.kind() == Some(ObjectType::Blob) {
            files.push(format!("{folder}{}", lossy(entry.name_bytes())));
        }
        TreeWalkResult::Ok
    })?;
    Ok(files)
}

#[cfg(test)]
mod tests {
    use crate::GitError;
    use crate::fixture::RepoFixture;

    /// The full state of the index and the working tree, as text.
    fn snapshot(fixture: &RepoFixture) -> String {
        let status = fixture.git(&["status", "--porcelain", "--untracked-files=all"]);
        let staged = fixture.git(&["diff", "--cached"]);
        format!("{status}\n{staged}\n{}", fixture.git(&["diff"]))
    }

    fn names(list: &[&str]) -> Vec<String> {
        list.iter().map(|&name| name.to_owned()).collect()
    }

    /// Staged and unstaged changes, a staged deletion, and untracked files.
    fn busy_tree() -> RepoFixture {
        let fixture = RepoFixture::new()
            .write("a.txt", "one\n")
            .write("other.txt", "other\n")
            .write("gone.txt", "gone\n")
            .commit("base")
            .write("a.txt", "one\nstaged\n")
            .stage("a.txt")
            .write("a.txt", "one\nstaged\nlater\n")
            .write("other.txt", "other\nchanged\n")
            .write("notes/new.txt", "new\n");
        fixture.git(&["rm", "--quiet", "gone.txt"]);
        fixture.write("gone.txt", "back\n")
    }

    #[test]
    fn discards_the_unstaged_changes_and_keeps_the_staged_changes() {
        let fixture = busy_tree();

        let files = names(&["a.txt", "notes/new.txt", "gone.txt"]);
        fixture.backend().discard(&files).unwrap();

        assert_eq!(
            fixture.git(&["status", "--porcelain", "--untracked-files=all"]),
            "M  a.txt\nD  gone.txt\n M other.txt"
        );
        assert_eq!(fixture.git(&["show", ":a.txt"]), "one\nstaged");
    }

    #[test]
    fn restores_the_exact_state_from_before_the_discard() {
        let fixture = busy_tree();
        let before = snapshot(&fixture);
        let backend = fixture.backend();

        let files = names(&["a.txt", "notes/new.txt", "gone.txt"]);
        let hash = backend.discard(&files).unwrap();
        backend.restore_discarded(&hash).unwrap();

        assert_eq!(snapshot(&fixture), before);
        assert!(backend.stashes().unwrap().is_empty());
    }

    #[test]
    fn keeps_a_copy_in_the_stash_with_the_names_of_the_files() {
        let fixture = busy_tree();

        let files = names(&["a.txt", "other.txt", "notes/new.txt", "gone.txt"]);
        let hash = fixture.backend().discard(&files).unwrap();

        let entries = fixture.backend().stashes().unwrap();
        assert_eq!(entries[0].hash, hash);
        assert_eq!(
            entries[0].message,
            "On main: Discarded by gitoverlord: a.txt, other.txt, notes/new.txt and 1 more"
        );
    }

    #[test]
    fn rejects_a_discard_without_changes() {
        let fixture = RepoFixture::new().commit("a");

        let error = fixture.backend().discard(&names(&["a.txt"])).unwrap_err();

        assert!(matches!(error, GitError::Rejected(_)), "error: {error:?}");
    }
}
