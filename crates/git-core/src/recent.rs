//! The list of the repositories that the user opened.

use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use specta::Type;

use crate::GitError;

const MAX_ENTRIES: usize = 10;

/// A repository that the user opened before.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct RecentRepo {
    pub name: String,
    pub path: String,
}

/// Keeps the recent repositories in one JSON file.
#[derive(Debug)]
pub struct RecentStore {
    file: PathBuf,
}

impl RecentStore {
    #[must_use]
    pub fn new(file: impl Into<PathBuf>) -> Self {
        Self { file: file.into() }
    }

    /// Lists the repositories that are still on the disk. The newest is first.
    ///
    /// A missing file or a file with bad content gives an empty list.
    #[must_use]
    pub fn list(&self) -> Vec<RecentRepo> {
        let mut entries = self.load();
        entries.retain(|entry| Path::new(&entry.path).is_dir());
        entries
    }

    /// Puts `repo` at the start of the list.
    ///
    /// # Errors
    ///
    /// Returns `GitError::Io` if the file cannot be written.
    pub fn remember(&self, repo: RecentRepo) -> Result<(), GitError> {
        let mut entries = self.load();
        entries.retain(|entry| entry.path != repo.path);
        entries.insert(0, repo);
        entries.truncate(MAX_ENTRIES);
        self.save(&entries)
    }

    fn load(&self) -> Vec<RecentRepo> {
        let content = fs::read_to_string(&self.file).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    }

    fn save(&self, entries: &[RecentRepo]) -> Result<(), GitError> {
        if let Some(folder) = self.file.parent() {
            fs::create_dir_all(folder)?;
        }
        let content = serde_json::to_string_pretty(entries)
            .map_err(|error| GitError::Io(error.to_string()))?;
        Ok(fs::write(&self.file, content)?)
    }
}

#[cfg(test)]
mod tests {
    use tempfile::TempDir;

    use super::*;

    /// Makes a store, and a function that creates a folder and gives its entry.
    fn store_in(root: &TempDir) -> (RecentStore, impl Fn(&str) -> RecentRepo) {
        let folders = root.path().to_owned();
        let entry = move |name: &str| {
            let path = folders.join(name);
            fs::create_dir_all(&path).unwrap();
            RecentRepo {
                name: name.to_owned(),
                path: path.to_string_lossy().into_owned(),
            }
        };
        (
            RecentStore::new(root.path().join("state/recent.json")),
            entry,
        )
    }

    fn names(store: &RecentStore) -> Vec<String> {
        store.list().into_iter().map(|entry| entry.name).collect()
    }

    #[test]
    fn starts_empty_when_the_file_is_missing_or_bad() {
        let root = tempfile::tempdir().unwrap();
        let (store, _) = store_in(&root);

        assert!(store.list().is_empty());

        fs::create_dir_all(root.path().join("state")).unwrap();
        fs::write(root.path().join("state/recent.json"), "not json").unwrap();
        assert!(store.list().is_empty());
    }

    #[test]
    fn puts_the_newest_repository_first_without_duplicates() {
        let root = tempfile::tempdir().unwrap();
        let (store, entry) = store_in(&root);

        for name in ["a", "b", "a"] {
            store.remember(entry(name)).unwrap();
        }

        assert_eq!(names(&store), ["a", "b"]);
    }

    #[test]
    fn keeps_only_the_newest_entries() {
        let root = tempfile::tempdir().unwrap();
        let (store, entry) = store_in(&root);

        for index in 0..MAX_ENTRIES + 2 {
            store.remember(entry(&format!("repo-{index}"))).unwrap();
        }

        assert_eq!(names(&store).len(), MAX_ENTRIES);
        assert_eq!(names(&store)[0], format!("repo-{}", MAX_ENTRIES + 1));
    }

    #[test]
    fn leaves_out_a_repository_that_is_not_on_the_disk() {
        let root = tempfile::tempdir().unwrap();
        let (store, entry) = store_in(&root);
        store.remember(entry("gone")).unwrap();
        store.remember(entry("here")).unwrap();

        fs::remove_dir(root.path().join("gone")).unwrap();

        assert_eq!(names(&store), ["here"]);
    }
}
