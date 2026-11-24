//! Reads and resolves the files with conflicts.

use std::fs;
use std::path::Path;

use git2::{IndexConflict, Repository};

use super::{count, lossy};
use crate::GitError;
use crate::cli::{resolve as resolve_cli, stage};
use crate::markers::{self, Part, without_ending};
use crate::model::{ConflictBlock, ConflictFile, ConflictSide, Resolution};

/// Lists the paths of the files with conflicts.
pub(super) fn paths(repo: &Repository) -> Result<Vec<String>, GitError> {
    Ok(conflicts(repo)?.into_iter().map(|(path, _)| path).collect())
}

/// Reads one file with conflicts from the working tree.
pub(super) fn read(repo: &Repository, dir: &Path, path: &str) -> Result<ConflictFile, GitError> {
    let conflict = find(repo, path)?;
    let text = read_text(&dir.join(path));
    Ok(ConflictFile {
        path: path.to_owned(),
        text: text.is_some(),
        ours_deleted: conflict.our.is_none(),
        theirs_deleted: conflict.their.is_none(),
        blocks: text.as_deref().map(blocks).unwrap_or_default(),
    })
}

/// Resolves the conflicts of `path` and stages the file.
pub(super) fn resolve(
    repo: &Repository,
    dir: &Path,
    path: &str,
    resolution: &Resolution,
) -> Result<(), GitError> {
    // Only a file with conflicts is written, so `path` is a file of the repository.
    let conflict = find(repo, path)?;
    let paths = [path.to_owned()];
    match resolution {
        Resolution::Blocks { choices } => {
            let file = dir.join(path);
            let text = read_text(&file).ok_or_else(not_text)?;
            fs::write(&file, markers::resolve(&text, choices)?)?;
        }
        Resolution::File { side } => {
            let entry = match side {
                ConflictSide::Ours => &conflict.our,
                ConflictSide::Theirs => &conflict.their,
            };
            if entry.is_none() {
                return stage::remove(dir, &paths);
            }
            resolve_cli::checkout_side(dir, *side, &paths)?;
        }
    }
    stage::add(dir, &paths)
}

/// Reads the conflicts of the index. The index is read again from the disk.
fn conflicts(repo: &Repository) -> Result<Vec<(String, IndexConflict)>, GitError> {
    let mut index = repo.index()?;
    index.read(false)?;
    let mut found = Vec::new();
    for conflict in index.conflicts()? {
        let conflict = conflict?;
        let entry = [&conflict.our, &conflict.their, &conflict.ancestor]
            .into_iter()
            .find_map(Option::as_ref);
        if let Some(entry) = entry {
            found.push((lossy(&entry.path), conflict));
        }
    }
    Ok(found)
}

fn find(repo: &Repository, path: &str) -> Result<IndexConflict, GitError> {
    let found = conflicts(repo)?.into_iter().find(|(name, _)| name == path);
    found
        .map(|(_, conflict)| conflict)
        .ok_or_else(|| GitError::Rejected(format!("The file {path} has no conflict.")))
}

/// Reads a text file. `None` for a missing file, a binary file, or a file that is not UTF-8.
fn read_text(file: &Path) -> Option<String> {
    let text = String::from_utf8(fs::read(file).ok()?).ok()?;
    (!text.contains('\0')).then_some(text)
}

fn not_text() -> GitError {
    GitError::Rejected("The file is not text. Keep one full side of it.".to_owned())
}

fn blocks(text: &str) -> Vec<ConflictBlock> {
    let lines = |list: &[&str]| {
        list.iter()
            .map(|line| without_ending(line).to_owned())
            .collect()
    };
    let parts = markers::parse(text);
    parts
        .iter()
        .map(|part| match part {
            Part::Clean(clean) => ConflictBlock::Clean {
                lines: lines(clean),
            },
            Part::Conflict(hunk) => ConflictBlock::Conflict {
                line: count(hunk.line + 1),
                ours: lines(&hunk.ours),
                theirs: lines(&hunk.theirs),
                ours_label: hunk.ours_label.to_owned(),
                theirs_label: hunk.theirs_label.to_owned(),
            },
        })
        .collect()
}
