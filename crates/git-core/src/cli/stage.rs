//! Moves changes between the working tree and the index.

use std::path::Path;

use super::{LITERAL_PATHS, PATHS_FROM_INPUT, run_git_on_paths, run_git_with_input};
use crate::GitError;

/// Adds the changes of `paths` to the index. A deleted file leaves the index.
pub(crate) fn add(dir: &Path, paths: &[String]) -> Result<(), GitError> {
    let [from_input, nul] = PATHS_FROM_INPUT;
    run_git_on_paths(
        dir,
        &[LITERAL_PATHS, "add", "--all", from_input, nul],
        paths,
    )
}

/// Gives `paths` in the index the version of `HEAD`. The working tree keeps its changes.
///
/// `unborn` is `true` when the repository has no commits. The files then leave the index.
pub(crate) fn reset(dir: &Path, paths: &[String], unborn: bool) -> Result<(), GitError> {
    let [from_input, nul] = PATHS_FROM_INPUT;
    if unborn {
        let args = ["rm", "--cached", "--force", "--quiet", from_input, nul];
        run_git_on_paths(dir, &[&[LITERAL_PATHS], args.as_slice()].concat(), paths)
    } else {
        let args = [LITERAL_PATHS, "restore", "--staged", from_input, nul];
        run_git_on_paths(dir, &args, paths)
    }
}

/// Writes the version of `paths` in the commit `source` to the working tree.
///
/// `staged` also writes it to the index. A file that `source` does not have is deleted.
pub(crate) fn restore(
    dir: &Path,
    source: &str,
    paths: &[String],
    staged: bool,
) -> Result<(), GitError> {
    let [from_input, nul] = PATHS_FROM_INPUT;
    let source = format!("--source={source}");
    let mut args = vec![LITERAL_PATHS, "restore", &source, "--worktree"];
    if staged {
        args.push("--staged");
    }
    args.extend([from_input, nul]);
    run_git_on_paths(dir, &args, paths)
}

/// Deletes `paths` from the index and from the working tree.
pub(crate) fn remove(dir: &Path, paths: &[String]) -> Result<(), GitError> {
    let [from_input, nul] = PATHS_FROM_INPUT;
    run_git_on_paths(
        dir,
        &[LITERAL_PATHS, "rm", "--quiet", from_input, nul],
        paths,
    )
}

/// Applies `patch` to the index. `reverse` removes the changes of the patch from the index.
pub(crate) fn apply_to_index(dir: &Path, patch: &[u8], reverse: bool) -> Result<(), GitError> {
    let mut args = vec!["apply", "--cached", "--whitespace=nowarn"];
    if reverse {
        args.push("--reverse");
    }
    args.push("-");
    run_git_with_input(dir, &args, patch).map(drop)
}

#[cfg(test)]
mod tests {
    use crate::GitError;
    use crate::fixture::RepoFixture;
    use crate::model::{FileDelta, HunkTarget, WorkingTree};

    fn paths(files: &[FileDelta]) -> Vec<&str> {
        files.iter().map(|file| file.path.as_str()).collect()
    }

    fn names(list: &[&str]) -> Vec<String> {
        list.iter().map(|&name| name.to_owned()).collect()
    }

    fn status(fixture: &RepoFixture) -> WorkingTree {
        fixture.backend().status().unwrap()
    }

    #[test]
    fn stages_a_change_a_deletion_and_an_untracked_file() {
        let fixture = RepoFixture::new()
            .commit("a")
            .commit("b")
            .write("a.txt", "changed\n")
            .remove("b.txt")
            .write("notes/new.txt", "new\n");

        let files = names(&["a.txt", "b.txt", "notes/new.txt"]);
        fixture.backend().stage(&files).unwrap();

        let tree = status(&fixture);
        assert_eq!(paths(&tree.staged), ["a.txt", "b.txt", "notes/new.txt"]);
        assert!(tree.unstaged.is_empty());
    }

    #[test]
    fn unstages_a_file_and_keeps_its_change_in_the_working_tree() {
        let fixture = RepoFixture::new()
            .commit("a")
            .write("a.txt", "changed\n")
            .stage("a.txt");

        fixture.backend().unstage(&names(&["a.txt"])).unwrap();

        let tree = status(&fixture);
        assert!(tree.staged.is_empty());
        assert_eq!(paths(&tree.unstaged), ["a.txt"]);
    }

    #[test]
    fn unstages_a_file_in_a_repository_without_commits() {
        let fixture = RepoFixture::new().write("a.txt", "a\n").stage("a.txt");

        fixture.backend().unstage(&names(&["a.txt"])).unwrap();

        let tree = status(&fixture);
        assert!(tree.staged.is_empty());
        assert_eq!(paths(&tree.unstaged), ["a.txt"]);
    }

    #[test]
    fn reads_each_path_as_a_file_name_and_not_as_a_pattern() {
        // As a pattern, `a[b].txt` also matches `ab.txt`. Windows permits
        // brackets in a file name, but not `*` or `?`.
        let fixture = RepoFixture::new()
            .write("a[b].txt", "brackets\n")
            .write("ab.txt", "plain\n");

        fixture.backend().stage(&names(&["a[b].txt"])).unwrap();

        assert_eq!(paths(&status(&fixture).staged), ["a[b].txt"]);
    }

    /// A file with two hunks: line 2 and line 19 change.
    fn two_hunks() -> RepoFixture {
        let lines: Vec<String> = (1..=20).map(|line| format!("line {line}\n")).collect();
        let changed = lines.concat().replace("line 2\n", "two\n");
        RepoFixture::new()
            .write("file.txt", &lines.concat())
            .commit("a")
            .write("file.txt", &changed.replace("line 19\n", "nineteen\n"))
    }

    fn hunk(fixture: &RepoFixture, staged: bool, index: u32) -> HunkTarget {
        let target = if staged {
            crate::DiffTarget::Staged {
                path: "file.txt".into(),
            }
        } else {
            crate::DiffTarget::Unstaged {
                path: "file.txt".into(),
            }
        };
        let diff = fixture.backend().file_diff(&target).unwrap();
        let position = usize::try_from(index).unwrap();
        HunkTarget {
            path: "file.txt".into(),
            index,
            header: diff.hunks[position].header.clone(),
        }
    }

    #[test]
    fn stages_one_hunk_and_unstages_it_again() {
        let fixture = two_hunks();
        let backend = fixture.backend();

        backend.stage_hunk(&hunk(&fixture, false, 1)).unwrap();
        let staged = fixture.git(&["diff", "--cached"]);
        let unstaged = fixture.git(&["diff"]);

        assert!(staged.contains("+nineteen") && !staged.contains("+two"));
        assert!(unstaged.contains("+two") && !unstaged.contains("+nineteen"));

        backend.unstage_hunk(&hunk(&fixture, true, 0)).unwrap();
        assert!(fixture.git(&["diff", "--cached"]).is_empty());
    }

    #[test]
    fn rejects_a_hunk_that_changed_after_the_user_saw_it() {
        let fixture = two_hunks();
        let mut target = hunk(&fixture, false, 0);
        target.header = "@@ -7,3 +7,3 @@".into();

        let error = fixture.backend().stage_hunk(&target).unwrap_err();

        assert!(matches!(error, GitError::Rejected(_)), "error: {error:?}");
    }
}
