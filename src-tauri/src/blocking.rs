use std::path::Path;

use git_core::{GitBackend, GitError, open_repo};

/// Runs blocking work, such as a `git` process, off the main thread.
///
/// # Panics
///
/// Panics if `task` panics.
pub async fn run_blocking<T, F>(task: F) -> T
where
    T: Send + 'static,
    F: FnOnce() -> T + Send + 'static,
{
    tauri::async_runtime::spawn_blocking(task)
        .await
        .expect("a blocking task panicked")
}

/// Opens the repository at `path` and runs `read` on it, off the main thread.
pub async fn with_repo<T, F>(path: String, read: F) -> Result<T, GitError>
where
    T: Send + 'static,
    F: FnOnce(&dyn GitBackend) -> Result<T, GitError> + Send + 'static,
{
    run_blocking(move || read(open_repo(Path::new(&path))?.as_ref())).await
}
