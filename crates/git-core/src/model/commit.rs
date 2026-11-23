use serde::Serialize;
use specta::Type;

use super::FileDelta;

/// One commit in the history.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Commit {
    pub hash: String,
    /// The first line of the message.
    pub subject: String,
    pub author: String,
    /// The commit time, in Unix seconds.
    // TypeScript has one number type. `i32` gives `number` in the bindings.
    #[specta(type = i32)]
    pub time: i64,
    pub parents: Vec<String>,
    /// The branches and tags that point to this commit, for example `main` or `tag: v1.0`.
    pub refs: Vec<String>,
}

/// One page of the history. The newest commit is first.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct LogPage {
    pub commits: Vec<Commit>,
    /// The `skip` value of the next page. `None` on the last page.
    pub next: Option<u32>,
}

/// A commit with its full message and its changed files.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CommitDetail {
    pub commit: Commit,
    /// The message after the subject line.
    pub body: String,
    pub email: String,
    /// The changes against the first parent.
    pub files: Vec<FileDelta>,
}
