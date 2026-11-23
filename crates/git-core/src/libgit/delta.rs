use git2::{Delta, Diff, DiffFile, Patch};

use super::count;
use crate::GitError;
use crate::model::{ChangeKind, FileDelta};

/// Reads each changed file of `diff` with its line counts.
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
    let (additions, deletions) = line_counts(diff, index)?;

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
