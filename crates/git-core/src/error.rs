use serde::Serialize;
use specta::Type;
use thiserror::Error;

/// A failure of a git operation.
///
/// The user interface receives this value as `{ kind, message }`.
#[derive(Debug, Clone, PartialEq, Eq, Error, Serialize, Type)]
#[serde(tag = "kind", content = "message", rename_all = "camelCase")]
pub enum GitError {
    /// The `git` executable is not on the `PATH`.
    #[error("the git executable was not found")]
    GitNotFound,
    /// The `git` process did not start, or it exited with a failure status.
    #[error("git failed: {0}")]
    CommandFailed(String),
    /// The output of `git` did not have the expected format.
    #[error("unexpected git output: {0}")]
    UnexpectedOutput(String),
}
