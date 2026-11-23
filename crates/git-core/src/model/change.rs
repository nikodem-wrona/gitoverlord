use serde::Serialize;
use specta::Type;

/// How a file changed.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum ChangeKind {
    Added,
    Modified,
    Deleted,
    Renamed,
    TypeChanged,
    Untracked,
    Conflicted,
}

/// One changed file with its line counts.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct FileDelta {
    pub path: String,
    /// The path before a rename.
    pub old_path: Option<String>,
    pub kind: ChangeKind,
    pub additions: u32,
    pub deletions: u32,
}

/// The changes that are not committed.
///
/// A file that is staged and then changed again is in both lists.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct WorkingTree {
    /// The index against `HEAD`.
    pub staged: Vec<FileDelta>,
    /// The working tree against the index. Conflicts are in this list.
    pub unstaged: Vec<FileDelta>,
}
