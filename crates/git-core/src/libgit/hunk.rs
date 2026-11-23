//! Makes a patch of one hunk, so `git apply` can move the hunk to or from the index.

use git2::{Delta, Patch, Repository};

use super::{delta, lossy, status};
use crate::GitError;
use crate::model::HunkTarget;

const CHANGED: &str = "The file changed. Look at the new diff, then try again.";
const RENAMED: &str = "Move the whole file. The hunks of a renamed file cannot move one at a time.";

/// Makes a patch with the file header and the hunk `target`.
///
/// `staged` selects the diff of the index against `HEAD`. Else the diff of the
/// working tree against the index is used.
pub(super) fn patch(
    repo: &Repository,
    target: &HunkTarget,
    staged: bool,
) -> Result<Vec<u8>, GitError> {
    let diff = if staged {
        status::staged_diff(repo)?
    } else {
        status::unstaged_diff(repo, Some(&target.path))?
    };
    let index = delta::position(&diff, &target.path).ok_or_else(changed)?;
    let renamed = diff
        .get_delta(index)
        .is_some_and(|found| matches!(found.status(), Delta::Renamed | Delta::Copied));
    if renamed {
        return Err(GitError::Rejected(RENAMED.into()));
    }
    let mut patch = Patch::from_diff(&diff, index)?.ok_or_else(changed)?;
    one_hunk(&patch.to_buf()?, target).ok_or_else(changed)
}

fn changed() -> GitError {
    GitError::Rejected(CHANGED.into())
}

/// Keeps the lines before the first hunk and the lines of the hunk at `target.index`.
///
/// Returns `None` if the hunk is not there or if it has a different header.
fn one_hunk(patch: &[u8], target: &HunkTarget) -> Option<Vec<u8>> {
    let lines: Vec<&[u8]> = patch.split_inclusive(|&byte| byte == b'\n').collect();
    // A changed line starts with a sign, so only a hunk header starts with "@@".
    let starts: Vec<usize> = (0..lines.len())
        .filter(|&line| lines[line].starts_with(b"@@"))
        .collect();
    let position = usize::try_from(target.index).ok()?;
    let start = *starts.get(position)?;
    let end = starts.get(position + 1).copied().unwrap_or(lines.len());
    if lossy(lines[start]).trim_end_matches(['\n', '\r']) != target.header {
        return None;
    }
    let header = &lines[..*starts.first()?];
    Some([header, &lines[start..end]].concat().concat())
}

#[cfg(test)]
mod tests {
    use super::one_hunk;
    use crate::model::HunkTarget;

    const PATCH: &str = "diff --git a/f b/f\n--- a/f\n+++ b/f\n\
        @@ -1 +1 @@\n-a\n+b\n@@ -9 +9 @@ fn main\n-c\n+d\n";

    fn target(index: u32, header: &str) -> HunkTarget {
        HunkTarget {
            path: "f".into(),
            index,
            header: header.into(),
        }
    }

    #[test]
    fn keeps_the_file_header_and_one_hunk() {
        let patch = one_hunk(PATCH.as_bytes(), &target(1, "@@ -9 +9 @@ fn main"));

        assert_eq!(
            String::from_utf8(patch.unwrap()).unwrap(),
            "diff --git a/f b/f\n--- a/f\n+++ b/f\n@@ -9 +9 @@ fn main\n-c\n+d\n"
        );
    }

    #[test]
    fn rejects_a_missing_hunk_or_a_different_header() {
        assert!(one_hunk(PATCH.as_bytes(), &target(2, "@@ -9 +9 @@")).is_none());
        assert!(one_hunk(PATCH.as_bytes(), &target(0, "@@ -2 +2 @@")).is_none());
    }
}
