use serde::{Deserialize, Serialize};
use specta::Type;

/// Selects the two versions of one file to compare.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum DiffTarget {
    /// A commit against its first parent.
    Commit { hash: String, path: String },
    /// The index against `HEAD`.
    Staged { path: String },
    /// The working tree against the index.
    Unstaged { path: String },
}

/// The changed lines of one file.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FileDiff {
    /// `true` for a file that has no text lines to show.
    pub binary: bool,
    /// `true` when the diff has more lines than the limit.
    pub truncated: bool,
    pub hunks: Vec<DiffHunk>,
}

/// One block of changed lines with its context.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DiffHunk {
    /// The hunk header, for example `@@ -1,4 +1,6 @@`.
    pub header: String,
    pub lines: Vec<DiffLine>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum LineKind {
    Context,
    Added,
    Removed,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DiffLine {
    pub kind: LineKind,
    /// The line number in the old version. `None` for an added line.
    pub old_line: Option<u32>,
    /// The line number in the new version. `None` for a removed line.
    pub new_line: Option<u32>,
    /// The text without the line ending.
    pub text: String,
}
