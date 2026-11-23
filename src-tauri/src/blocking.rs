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
