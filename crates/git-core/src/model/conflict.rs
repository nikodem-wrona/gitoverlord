use serde::{Deserialize, Serialize};
use specta::Type;

/// One version of a file with conflicts. "Ours" is `HEAD`, "theirs" is the incoming commit.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum ConflictSide {
    Ours,
    Theirs,
}

/// The lines that replace one conflict.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum ConflictChoice {
    Ours,
    Theirs,
    /// The lines of ours, then the lines of theirs.
    Both,
}

/// How to resolve the conflicts of one file.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum Resolution {
    /// One choice for each conflict of the file, in the order of the file.
    Blocks { choices: Vec<ConflictChoice> },
    /// The full file of one side. When that side deleted the file, the file is deleted.
    File { side: ConflictSide },
}

/// A part of a file with conflict markers.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum ConflictBlock {
    /// Lines without a conflict.
    Clean { lines: Vec<String> },
    /// One conflict: the lines of each side.
    Conflict {
        /// The line of the `<<<<<<<` marker, from 1.
        line: u32,
        ours: Vec<String>,
        theirs: Vec<String>,
        /// The name after the `<<<<<<<` marker, for example `HEAD`.
        #[serde(rename = "oursLabel")]
        ours_label: String,
        /// The name after the `>>>>>>>` marker, for example `feature`.
        #[serde(rename = "theirsLabel")]
        theirs_label: String,
    },
}

/// A file with conflicts, as the working tree has it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ConflictFile {
    pub path: String,
    /// `false` when the file is binary, is not UTF-8, or is not in the working
    /// tree. Then only a full side can resolve it.
    pub text: bool,
    /// `true` when `HEAD` deleted the file.
    pub ours_deleted: bool,
    /// `true` when the incoming commit deleted the file.
    pub theirs_deleted: bool,
    /// The file in parts. Empty when the file is not text.
    pub blocks: Vec<ConflictBlock>,
}
