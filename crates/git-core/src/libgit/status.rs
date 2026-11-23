use git2::{Diff, DiffOptions, ErrorCode, Repository, Tree};

use super::delta;
use crate::GitError;
use crate::model::{ChangeKind, WorkingTree};

pub(super) fn read(repo: &Repository) -> Result<WorkingTree, GitError> {
    let mut staged = delta::list(&staged_diff(repo)?)?;
    // A conflict is in both diffs. The unstaged list keeps it.
    staged.retain(|file| file.kind != ChangeKind::Conflicted);

    Ok(WorkingTree {
        staged,
        unstaged: delta::list(&unstaged_diff(repo, None)?)?,
    })
}

/// Compares the index with `HEAD`. Renames are detected.
pub(super) fn staged_diff(repo: &Repository) -> Result<Diff<'_>, GitError> {
    let head = head_tree(repo)?;
    let mut diff = repo.diff_tree_to_index(head.as_ref(), None, None)?;
    diff.find_similar(None)?;
    Ok(diff)
}

/// Compares the working tree with the index. `path` limits the diff to one file.
pub(super) fn unstaged_diff<'repo>(
    repo: &'repo Repository,
    path: Option<&str>,
) -> Result<Diff<'repo>, GitError> {
    let mut options = DiffOptions::new();
    options
        .include_untracked(true)
        .recurse_untracked_dirs(true)
        .show_untracked_content(true);
    if let Some(path) = path {
        options.pathspec(path).disable_pathspec_match(true);
    }
    Ok(repo.diff_index_to_workdir(None, Some(&mut options))?)
}

/// Returns the tree of `HEAD`, or `None` when the repository has no commits.
fn head_tree(repo: &Repository) -> Result<Option<Tree<'_>>, GitError> {
    match repo.head() {
        Ok(head) => Ok(Some(head.peel_to_tree()?)),
        Err(error) if error.code() == ErrorCode::UnbornBranch => Ok(None),
        Err(error) => Err(error.into()),
    }
}

#[cfg(test)]
mod tests {
    use crate::fixture::RepoFixture;
    use crate::model::{ChangeKind, FileDelta};

    fn summary(files: &[FileDelta]) -> Vec<(&str, ChangeKind, u32, u32)> {
        files
            .iter()
            .map(|file| {
                (
                    file.path.as_str(),
                    file.kind,
                    file.additions,
                    file.deletions,
                )
            })
            .collect()
    }

    #[test]
    fn reports_a_clean_working_tree_as_empty() {
        let status = RepoFixture::new().commit("a").backend().status().unwrap();

        assert!(status.staged.is_empty());
        assert!(status.unstaged.is_empty());
    }

    #[test]
    fn separates_the_staged_changes_from_the_unstaged_changes() {
        let fixture = RepoFixture::new()
            .write("keep.txt", "one\ntwo\n")
            .commit("a")
            .write("staged.txt", "new\n")
            .stage("staged.txt")
            .write("keep.txt", "one\nthree\n")
            .write("notes/idea.txt", "idea\n")
            .remove("a.txt");

        let status = fixture.backend().status().unwrap();

        assert_eq!(
            summary(&status.staged),
            [("staged.txt", ChangeKind::Added, 1, 0)]
        );
        assert_eq!(
            summary(&status.unstaged),
            [
                ("a.txt", ChangeKind::Deleted, 0, 1),
                ("keep.txt", ChangeKind::Modified, 1, 1),
                ("notes/idea.txt", ChangeKind::Untracked, 1, 0),
            ]
        );
    }

    #[test]
    fn lists_a_file_twice_when_it_changes_after_it_is_staged() {
        let fixture = RepoFixture::new()
            .commit("a")
            .write("a.txt", "staged\n")
            .stage("a.txt")
            .write("a.txt", "staged\nlater\n");

        let status = fixture.backend().status().unwrap();

        assert_eq!(
            summary(&status.staged),
            [("a.txt", ChangeKind::Modified, 1, 1)]
        );
        assert_eq!(
            summary(&status.unstaged),
            [("a.txt", ChangeKind::Modified, 1, 0)]
        );
    }

    #[test]
    fn reports_a_staged_rename_with_the_old_path() {
        let fixture = RepoFixture::new()
            .write("old.txt", "one\ntwo\nthree\n")
            .commit("a");
        fixture.git(&["mv", "old.txt", "new.txt"]);

        let status = fixture.backend().status().unwrap();

        assert_eq!(status.staged[0].kind, ChangeKind::Renamed);
        assert_eq!(status.staged[0].path, "new.txt");
        assert_eq!(status.staged[0].old_path.as_deref(), Some("old.txt"));
    }

    #[test]
    fn reports_a_conflict_once_in_the_unstaged_list() {
        let fixture = RepoFixture::new()
            .write("file.txt", "base\n")
            .commit("a")
            .branch("feature")
            .write("file.txt", "feature\n")
            .save("feature change")
            .switch("main")
            .write("file.txt", "main\n")
            .save("main change")
            .merge("feature");

        let status = fixture.backend().status().unwrap();

        let conflicts = |files: &[FileDelta]| {
            let found = files
                .iter()
                .filter(|file| file.kind == ChangeKind::Conflicted);
            found.map(|file| file.path.clone()).collect::<Vec<_>>()
        };
        assert!(conflicts(&status.staged).is_empty());
        assert_eq!(conflicts(&status.unstaged), ["file.txt"]);
    }

    #[test]
    fn reads_the_changes_of_a_repository_without_commits() {
        let fixture = RepoFixture::new().write("a.txt", "a\n").stage("a.txt");

        let status = fixture.backend().status().unwrap();

        assert_eq!(
            summary(&status.staged),
            [("a.txt", ChangeKind::Added, 1, 0)]
        );
    }
}
