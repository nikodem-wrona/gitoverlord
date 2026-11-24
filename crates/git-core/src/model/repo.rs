use serde::Serialize;
use specta::Type;

use super::Operation;

/// The commit and the branch that `HEAD` points to.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Head {
    /// The current branch. `None` when `HEAD` is detached.
    pub branch: Option<String>,
    /// The commit at `HEAD`. `None` when the repository has no commits.
    pub hash: Option<String>,
}

/// The identity of a repository and its named references.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct RepoSummary {
    /// The name of the working tree folder.
    pub name: String,
    /// The path of the working tree. Each other command takes this value.
    pub path: String,
    pub head: Head,
    pub remotes: Vec<String>,
    /// The newest name is first.
    pub tags: Vec<String>,
    /// The time of the last fetch, in Unix seconds. `None` before the first fetch.
    #[specta(type = Option<i32>)]
    pub fetched: Option<i64>,
    /// The merge, rebase, cherry-pick, or revert that stopped. `None` when no operation runs.
    pub operation: Option<Operation>,
}

/// A local branch.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Branch {
    pub name: String,
    /// `true` for the branch that `HEAD` points to.
    pub current: bool,
    /// The remote branch that this branch follows, for example `origin/main`.
    pub upstream: Option<String>,
    /// The number of commits that the upstream does not have.
    pub ahead: u32,
    /// The number of upstream commits that this branch does not have.
    pub behind: u32,
    /// The hash of the newest commit.
    pub tip: String,
    /// The time of the newest commit, in Unix seconds.
    // TypeScript has one number type. `i32` gives `number` in the bindings.
    #[specta(type = i32)]
    pub updated: i64,
}
