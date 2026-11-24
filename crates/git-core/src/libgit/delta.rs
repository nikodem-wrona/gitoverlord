use git2::{Delta, Diff, DiffFile, Patch};

use super::count;
use crate::GitError;
use crate::model::{ChangeKind, FileDelta};

/// The line counts read the content of each file. A change of more files
/// gets line counts for its first files only, so a large change stays fast.
const COUNTED_FILES: usize = 1000;

/// Reads each changed file of `diff`, with the line counts of the first files.
pub(super) fn list(diff: &Diff<'_>) -> Result<Vec<FileDelta>, GitError> {
    (0..diff.deltas().len())
        .filter_map(|index| read(diff, index).transpose())
        .collect()
}

/// Finds the position of the file `path` in `diff`.
pub(super) fn position(diff: &Diff<'_>, path: &str) -> Option<usize> {
    diff.deltas()
        .position(|delta| path_of(&delta.new_file()).as_deref() == Some(path))
}

fn read(diff: &Diff<'_>, index: usize) -> Result<Option<FileDelta>, GitError> {
    let Some(delta) = diff.get_delta(index) else {
        return Ok(None);
    };
    let Some(path) = path_of(&delta.new_file()) else {
        return Ok(None);
    };
    let old_path = path_of(&delta.old_file()).filter(|old| *old != path);
    let (additions, deletions) = if index < COUNTED_FILES {
        let (additions, deletions) = line_counts(diff, index)?;
        (Some(additions), Some(deletions))
    } else {
        (None, None)
    };

    Ok(Some(FileDelta {
        path,
        old_path,
        kind: kind_of(delta.status()),
        additions,
        deletions,
    }))
}

fn path_of(file: &DiffFile<'_>) -> Option<String> {
    Some(file.path()?.to_string_lossy().into_owned())
}

/// Counts the added and the removed lines. A binary file has no lines.
fn line_counts(diff: &Diff<'_>, index: usize) -> Result<(u32, u32), GitError> {
    let Some(patch) = Patch::from_diff(diff, index)? else {
        return Ok((0, 0));
    };
    let (_, additions, deletions) = patch.line_stats()?;
    Ok((count(additions), count(deletions)))
}

fn kind_of(status: Delta) -> ChangeKind {
    match status {
        Delta::Added => ChangeKind::Added,
        Delta::Deleted => ChangeKind::Deleted,
        Delta::Renamed | Delta::Copied => ChangeKind::Renamed,
        Delta::Typechange => ChangeKind::TypeChanged,
        Delta::Untracked => ChangeKind::Untracked,
        Delta::Conflicted => ChangeKind::Conflicted,
        _ => ChangeKind::Modified,
    }
}

#[cfg(test)]
mod tests {
    use super::COUNTED_FILES;
    use crate::fixture::RepoFixture;

    #[test]
    fn counts_the_lines_of_the_first_files_only() {
        let mut fixture = RepoFixture::new();
        for file in 0..=COUNTED_FILES {
            fixture = fixture.write(&format!("f{file:04}.txt"), "a\nb\n");
        }

        let status = fixture.backend().status().unwrap();

        let first = &status.unstaged[0];
        assert_eq!((first.additions, first.deletions), (Some(2), Some(0)));
        let last = &status.unstaged[COUNTED_FILES];
        assert_eq!((last.additions, last.deletions), (None, None));
    }
}
