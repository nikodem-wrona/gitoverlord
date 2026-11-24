//! Watches a repository on the disk and reports what changed.

use std::path::{Path, PathBuf};
use std::time::Duration;

use git2::Repository;
use notify_debouncer_mini::notify::{RecommendedWatcher, RecursiveMode};
use notify_debouncer_mini::{DebounceEventResult, DebouncedEventBatch, Debouncer, new_debouncer};
use serde::Serialize;
use specta::Type;

use crate::GitError;
use crate::libgit::open_repository;

/// Many file events in a short time give one report.
const DEBOUNCE: Duration = Duration::from_millis(300);

/// The parts of a repository that changed on the disk.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Type)]
pub struct RepoChange {
    /// `HEAD`, a branch, or a tag moved. The history and the branch list are old.
    pub refs: bool,
    /// The working tree or the index changed. The status is old.
    pub files: bool,
}

impl RepoChange {
    const ALL: Self = Self {
        refs: true,
        files: true,
    };
    const FILES: Self = Self {
        refs: false,
        files: true,
    };

    fn merge(self, other: Self) -> Self {
        Self {
            refs: self.refs || other.refs,
            files: self.files || other.files,
        }
    }

    fn is_empty(self) -> bool {
        self == Self::default()
    }
}

/// Watches one repository. The watch stops when this value is dropped.
pub struct RepoWatcher {
    _debouncer: Debouncer<RecommendedWatcher>,
}

impl RepoWatcher {
    /// Starts to watch the repository at `path`. `on_change` runs on a background thread.
    ///
    /// # Errors
    ///
    /// Returns an error if `path` is not a repository or if the system refuses the watch.
    pub fn start<F>(path: &Path, on_change: F) -> Result<Self, GitError>
    where
        F: Fn(RepoChange) + Send + 'static,
    {
        let repo = open_repository(path)?;
        let roots = watch_roots(&repo);
        let mut debouncer = new_debouncer(DEBOUNCE, move |result: DebounceEventResult| {
            let change = summarize(&repo, result);
            if !change.is_empty() {
                on_change(change);
            }
        })
        .map_err(watch_error)?;

        for root in roots {
            let watcher = debouncer.watcher();
            watcher
                .watch(&root, RecursiveMode::Recursive)
                .map_err(watch_error)?;
        }
        Ok(Self {
            _debouncer: debouncer,
        })
    }
}

fn watch_error(error: notify_debouncer_mini::notify::Error) -> GitError {
    GitError::Io(error.to_string())
}

/// Returns the folders to watch: the working tree, and the git folder when it is outside.
///
/// A linked worktree keeps its git folder in the main repository.
fn watch_roots(repo: &Repository) -> Vec<PathBuf> {
    let mut roots: Vec<PathBuf> = repo.workdir().map(Path::to_owned).into_iter().collect();
    for folder in [repo.commondir(), repo.path()] {
        if !roots.iter().any(|root| folder.starts_with(root)) {
            roots.push(folder.to_owned());
        }
    }
    roots
}

fn summarize(repo: &Repository, result: DebounceEventResult) -> RepoChange {
    match result {
        Ok(DebouncedEventBatch::Events(events)) => events
            .iter()
            .map(|event| classify(repo, &event.path))
            .fold(RepoChange::default(), RepoChange::merge),
        // Events were lost or the watch failed. Read everything again.
        _ => RepoChange::ALL,
    }
}

/// Decides which part of the repository the file at `path` belongs to.
fn classify(repo: &Repository, path: &Path) -> RepoChange {
    for git_folder in [repo.path(), repo.commondir()] {
        if let Ok(inner) = path.strip_prefix(git_folder) {
            return classify_git_file(inner);
        }
    }
    let inner = repo
        .workdir()
        .and_then(|workdir| path.strip_prefix(workdir).ok());
    match inner {
        Some(inner) if repo.is_path_ignored(inner).unwrap_or(false) => RepoChange::default(),
        _ => RepoChange::FILES,
    }
}

/// Classifies a path that is relative to the git folder.
fn classify_git_file(inner: &Path) -> RepoChange {
    // Git writes a lock file first, then renames it.
    if inner
        .extension()
        .is_some_and(|extension| extension == "lock")
    {
        return RepoChange::default();
    }
    let first = inner.components().next();
    match first.and_then(|part| part.as_os_str().to_str()) {
        Some("HEAD" | "packed-refs" | "refs") => RepoChange::ALL,
        // A merge, rebase, cherry-pick, or revert started, stopped, or ended.
        Some(
            "MERGE_HEAD" | "REBASE_HEAD" | "CHERRY_PICK_HEAD" | "REVERT_HEAD" | "rebase-merge"
            | "rebase-apply" | "sequencer",
        ) => RepoChange::ALL,
        Some("index") => RepoChange::FILES,
        _ => RepoChange::default(),
    }
}

#[cfg(test)]
mod tests {
    use std::sync::mpsc;

    use super::*;
    use crate::fixture::RepoFixture;

    fn classify_in(fixture: &RepoFixture, relative: &str) -> RepoChange {
        let repo = fixture.repository();
        let workdir = repo.workdir().unwrap().to_owned();
        classify(&repo, &workdir.join(relative))
    }

    #[test]
    fn reports_a_moved_reference_as_a_change_of_everything() {
        let fixture = RepoFixture::new().commit("a");

        assert_eq!(classify_in(&fixture, ".git/HEAD"), RepoChange::ALL);
        assert_eq!(classify_in(&fixture, ".git/MERGE_HEAD"), RepoChange::ALL);
        assert_eq!(
            classify_in(&fixture, ".git/rebase-merge/msgnum"),
            RepoChange::ALL
        );
        assert_eq!(
            classify_in(&fixture, ".git/refs/heads/main"),
            RepoChange::ALL
        );
    }

    #[test]
    fn reports_the_index_and_the_working_tree_as_file_changes() {
        let fixture = RepoFixture::new().commit("a");

        assert_eq!(classify_in(&fixture, ".git/index"), RepoChange::FILES);
        assert_eq!(classify_in(&fixture, "src/new.txt"), RepoChange::FILES);
    }

    #[test]
    fn ignores_lock_files_objects_and_ignored_paths() {
        let fixture = RepoFixture::new()
            .write(".gitignore", "target/\n")
            .commit("a");

        for path in [
            ".git/index.lock",
            ".git/objects/ab/cdef",
            "target/debug/app",
        ] {
            assert_eq!(classify_in(&fixture, path), RepoChange::default(), "{path}");
        }
    }

    #[test]
    fn calls_back_when_a_file_changes() {
        let fixture = RepoFixture::new().commit("a");
        let (sender, receiver) = mpsc::channel();
        let watcher = RepoWatcher::start(&fixture.path(), move |change| {
            let _ = sender.send(change);
        })
        .unwrap();

        let fixture = fixture.write("b.txt", "b\n");

        let change = receiver.recv_timeout(Duration::from_secs(20)).unwrap();
        assert!(change.files, "change: {change:?}");
        // The watch must stop before the folder is deleted.
        drop(watcher);
        drop(fixture);
    }

    #[test]
    fn rejects_a_folder_that_is_not_a_repository() {
        let folder = tempfile::tempdir().unwrap();

        let result = RepoWatcher::start(folder.path(), |_| {});

        assert!(matches!(result, Err(GitError::NotARepository(_))));
    }
}
