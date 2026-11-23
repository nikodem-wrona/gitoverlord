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
    /// The folder is not in a git repository that has a working tree.
    #[error("not a git repository: {0}")]
    NotARepository(String),
    /// The git library could not read the repository.
    #[error("the repository could not be read: {0}")]
    ReadFailed(String),
    /// The operation is not possible in the current state of the repository.
    /// The message tells the user what to do.
    #[error("{0}")]
    Rejected(String),
    /// A file of the application could not be read or written.
    #[error("file access failed: {0}")]
    Io(String),
}

impl From<git2::Error> for GitError {
    fn from(error: git2::Error) -> Self {
        Self::ReadFailed(error.message().to_owned())
    }
}

impl From<std::io::Error> for GitError {
    fn from(error: std::io::Error) -> Self {
        Self::Io(error.to_string())
    }
}
