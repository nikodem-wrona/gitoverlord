use std::collections::HashMap;

use git2::{Oid, Reference, Repository};

use super::lossy;
use crate::GitError;

/// The branch and tag names for each commit that has them.
pub(super) struct RefIndex(HashMap<Oid, Vec<String>>);

impl RefIndex {
    pub(super) fn read(repo: &Repository) -> Result<Self, GitError> {
        let mut index: HashMap<Oid, Vec<String>> = HashMap::new();
        for reference in repo.references()? {
            let reference = reference?;
            let Some(label) = label(&reference) else {
                continue;
            };
            // A reference to a tree or a blob has no commit.
            if let Ok(commit) = reference.peel_to_commit() {
                index.entry(commit.id()).or_default().push(label);
            }
        }
        Ok(Self(index))
    }

    pub(super) fn names(&self, id: Oid) -> Vec<String> {
        self.0.get(&id).cloned().unwrap_or_default()
    }
}

fn label(reference: &Reference<'_>) -> Option<String> {
    let name = lossy(reference.shorthand_bytes());
    if reference.is_tag() {
        return Some(format!("tag: {name}"));
    }
    let remote_head = reference.is_remote() && name.ends_with("/HEAD");
    let named = reference.is_branch() || reference.is_remote();
    (named && !remote_head).then_some(name)
}
