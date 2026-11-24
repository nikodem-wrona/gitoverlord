//! The stash. `git stash` keeps changes as commits, and `refs/stash` lists them.

use std::path::Path;

use super::{LITERAL_PATHS, PATHS_FROM_INPUT, run_git_in, run_git_on_paths};
use crate::GitError;

/// Moves each change to a new entry. Untracked files are included.
///
/// Without a message, `git` writes the branch and the last commit as the message.
pub(crate) fn save(dir: &Path, message: &str) -> Result<(), GitError> {
    let mut args = vec!["stash", "push", "--quiet", "--include-untracked"];
    if !message.trim().is_empty() {
        args.extend(["--message", message]);
    }
    run_git_in(dir, &args).map(drop)
}

/// Moves the changes of `paths` to a new entry. Both the index and the working tree lose them.
pub(crate) fn save_paths(dir: &Path, message: &str, paths: &[String]) -> Result<(), GitError> {
    let [from_input, nul] = PATHS_FROM_INPUT;
    let args = [
        LITERAL_PATHS,
        "stash",
        "push",
        "--quiet",
        "--include-untracked",
        "--message",
        message,
        from_input,
        nul,
    ];
    run_git_on_paths(dir, &args, paths)
}

/// Applies the entry at `index` to the working tree. The entry stays in the list.
pub(crate) fn apply(dir: &Path, index: usize) -> Result<(), GitError> {
    run_git_in(dir, &["stash", "apply", "--quiet", &entry(index)]).map(drop)
}

/// Applies the entry at `index` and removes it. A conflict keeps the entry.
pub(crate) fn pop(dir: &Path, index: usize) -> Result<(), GitError> {
    run_git_in(dir, &["stash", "pop", "--quiet", &entry(index)]).map(drop)
}

pub(crate) fn drop_entry(dir: &Path, index: usize) -> Result<(), GitError> {
    run_git_in(dir, &["stash", "drop", "--quiet", &entry(index)]).map(drop)
}

/// Applies the entry at `index` with its staged changes. The entry stays in the list.
pub(crate) fn apply_with_index(dir: &Path, index: usize) -> Result<(), GitError> {
    run_git_in(
        dir,
        &["stash", "apply", "--index", "--quiet", &entry(index)],
    )
    .map(drop)
}

/// Makes a stash commit of the tracked changes. The working tree and the list do not change.
///
/// Returns `None` when there are no changes.
pub(crate) fn create(dir: &Path, message: &str) -> Result<Option<String>, GitError> {
    let hash = run_git_in(dir, &["stash", "create", message])?;
    let hash = hash.trim();
    Ok((!hash.is_empty()).then(|| hash.to_owned()))
}

/// Puts the stash commit `hash` at the start of the list.
pub(crate) fn store(dir: &Path, hash: &str, message: &str) -> Result<(), GitError> {
    run_git_in(dir, &["stash", "store", "--message", message, hash]).map(drop)
}

fn entry(index: usize) -> String {
    format!("stash@{{{index}}}")
}
