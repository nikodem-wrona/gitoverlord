//! The Tauri shell of gitoverlord.
//!
//! This crate starts the application and makes `git-core` available to the
//! user interface. Keep git logic in `git-core`.

mod blocking;
mod commands;
mod ipc;

/// Starts the application.
///
/// # Panics
///
/// Panics if the Tauri runtime does not start.
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(ipc::builder().invoke_handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
