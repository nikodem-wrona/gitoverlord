//! Resolves conflicts in the working tree and in the index.

use std::path::Path;

use super::{LITERAL_PATHS, PATHS_FROM_INPUT, run_git_on_paths};
use crate::GitError;
use crate::model::ConflictSide;

/// Writes the version of `side` to `paths` in the working tree. The index keeps the conflict.
pub(crate) fn checkout_side(
    dir: &Path,
    side: ConflictSide,
    paths: &[String],
) -> Result<(), GitError> {
    let flag = match side {
        ConflictSide::Ours => "--ours",
        ConflictSide::Theirs => "--theirs",
    };
    let [from_input, nul] = PATHS_FROM_INPUT;
    run_git_on_paths(
        dir,
        &[LITERAL_PATHS, "checkout", flag, from_input, nul],
        paths,
    )
}

/// Writes the conflicts of `paths` back to the working tree and the index.
///
/// The index remembers a resolved conflict, so this also works after `git add`.
pub(crate) fn restore(dir: &Path, paths: &[String]) -> Result<(), GitError> {
    let [from_input, nul] = PATHS_FROM_INPUT;
    run_git_on_paths(
        dir,
        &[LITERAL_PATHS, "checkout", "--merge", from_input, nul],
        paths,
    )
}
