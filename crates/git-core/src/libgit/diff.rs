use git2::{DiffLine as RawLine, Patch, Repository};

use super::{delta, detail, lossy, status};
use crate::GitError;
use crate::model::{DiffHunk, DiffLine, DiffTarget, FileDiff, LineKind};

/// A diff with more lines makes the user interface slow.
const MAX_LINES: usize = 5000;

pub(super) fn read(repo: &Repository, target: &DiffTarget) -> Result<FileDiff, GitError> {
    let (diff, path) = match target {
        DiffTarget::Commit { hash, path } => {
            let commit = detail::find_commit(repo, hash)?;
            (detail::commit_diff(repo, &commit)?, path)
        }
        DiffTarget::Staged { path } => (status::staged_diff(repo)?, path),
        DiffTarget::Unstaged { path } => (status::unstaged_diff(repo, Some(path))?, path),
    };
    let Some(index) = delta::position(&diff, path) else {
        return Ok(FileDiff::default());
    };
    match Patch::from_diff(&diff, index)? {
        Some(patch) => read_patch(&patch),
        None => Ok(binary()),
    }
}

fn binary() -> FileDiff {
    FileDiff {
        binary: true,
        ..FileDiff::default()
    }
}

fn read_patch(patch: &Patch<'_>) -> Result<FileDiff, GitError> {
    if patch.delta().flags().is_binary() {
        return Ok(binary());
    }
    let mut file = FileDiff::default();
    let mut budget = MAX_LINES;
    for hunk_index in 0..patch.num_hunks() {
        let (hunk, line_count) = patch.hunk(hunk_index)?;
        let taken = line_count.min(budget);
        let lines = (0..taken).map(|line| read_line(patch, hunk_index, line));
        file.hunks.push(DiffHunk {
            header: text(hunk.header()),
            lines: lines
                .filter_map(Result::transpose)
                .collect::<Result<_, _>>()?,
        });
        budget -= taken;
        if taken < line_count {
            file.truncated = true;
            break;
        }
    }
    Ok(file)
}

/// Returns `None` for a marker line, such as "No newline at end of file".
fn read_line(patch: &Patch<'_>, hunk: usize, line: usize) -> Result<Option<DiffLine>, GitError> {
    let raw = patch.line_in_hunk(hunk, line)?;
    let Some(kind) = kind_of(&raw) else {
        return Ok(None);
    };
    Ok(Some(DiffLine {
        kind,
        old_line: raw.old_lineno(),
        new_line: raw.new_lineno(),
        text: text(raw.content()),
    }))
}

fn kind_of(line: &RawLine<'_>) -> Option<LineKind> {
    match line.origin() {
        ' ' => Some(LineKind::Context),
        '+' => Some(LineKind::Added),
        '-' => Some(LineKind::Removed),
        _ => None,
    }
}

fn text(bytes: &[u8]) -> String {
    lossy(bytes).trim_end_matches(['\n', '\r']).to_owned()
}

#[cfg(test)]
mod tests {
    use super::MAX_LINES;
    use crate::fixture::RepoFixture;
    use crate::model::{DiffTarget, FileDiff, LineKind};

    fn lines(diff: &FileDiff) -> Vec<(LineKind, Option<u32>, Option<u32>, &str)> {
        let all = diff.hunks.iter().flat_map(|hunk| &hunk.lines);
        all.map(|line| (line.kind, line.old_line, line.new_line, line.text.as_str()))
            .collect()
    }

    fn unstaged(path: &str) -> DiffTarget {
        DiffTarget::Unstaged { path: path.into() }
    }

    #[test]
    fn reads_the_lines_of_a_commit_with_their_numbers() {
        let fixture = RepoFixture::new()
            .write("file.txt", "one\ntwo\n")
            .commit("a")
            .write("file.txt", "one\nthree\n")
            .save("b");
        let target = DiffTarget::Commit {
            hash: "HEAD".into(),
            path: "file.txt".into(),
        };

        let diff = fixture.backend().file_diff(&target).unwrap();

        assert_eq!(diff.hunks[0].header, "@@ -1,2 +1,2 @@");
        assert_eq!(
            lines(&diff),
            [
                (LineKind::Context, Some(1), Some(1), "one"),
                (LineKind::Removed, Some(2), None, "two"),
                (LineKind::Added, None, Some(2), "three"),
            ]
        );
    }

    #[test]
    fn separates_the_staged_diff_from_the_unstaged_diff() {
        let fixture = RepoFixture::new()
            .commit("a")
            .write("a.txt", "staged\n")
            .stage("a.txt")
            .write("a.txt", "staged\nlater\n");
        let backend = fixture.backend();

        let staged = backend.file_diff(&DiffTarget::Staged {
            path: "a.txt".into(),
        });
        let later = backend.file_diff(&unstaged("a.txt"));

        let added = |diff: &FileDiff| {
            let all = lines(diff).into_iter();
            let found = all.filter(|line| line.0 == LineKind::Added);
            found.map(|line| line.3.to_owned()).collect::<Vec<_>>()
        };
        assert_eq!(added(&staged.unwrap()), ["staged"]);
        assert_eq!(added(&later.unwrap()), ["later"]);
    }

    #[test]
    fn shows_an_untracked_file_as_added_lines() {
        let fixture = RepoFixture::new()
            .commit("a")
            .write("new.txt", "one\ntwo\n");

        let diff = fixture.backend().file_diff(&unstaged("new.txt")).unwrap();

        assert_eq!(
            lines(&diff),
            [
                (LineKind::Added, None, Some(1), "one"),
                (LineKind::Added, None, Some(2), "two"),
            ]
        );
    }

    #[test]
    fn marks_a_binary_file() {
        let fixture = RepoFixture::new().commit("a");
        std::fs::write(fixture.path().join("image.bin"), [0, 159, 146, 150, 0]).unwrap();

        let diff = fixture.backend().file_diff(&unstaged("image.bin")).unwrap();

        assert!(diff.binary);
        assert!(diff.hunks.is_empty());
    }

    #[test]
    fn stops_at_the_line_limit() {
        let content = "line\n".repeat(MAX_LINES + 10);
        let fixture = RepoFixture::new().commit("a").write("big.txt", &content);

        let diff = fixture.backend().file_diff(&unstaged("big.txt")).unwrap();

        assert!(diff.truncated);
        assert_eq!(lines(&diff).len(), MAX_LINES);
    }

    #[test]
    fn gives_an_empty_diff_for_a_file_without_changes() {
        let fixture = RepoFixture::new().commit("a");

        let diff = fixture.backend().file_diff(&unstaged("a.txt")).unwrap();

        assert_eq!(diff, FileDiff::default());
    }
}
