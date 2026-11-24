//! The Tauri shell of gitoverlord.
//!
//! This crate starts the application and makes `git-core` available to the
//! user interface. Keep git logic in `git-core`.

mod blocking;
mod commands;
mod events;
mod ipc;
mod session;

use tauri::Manager;

use crate::session::Session;

/// Starts the application.
///
/// # Panics
///
/// Panics if the Tauri runtime does not start.
pub fn run() {
    let ipc = ipc::builder();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(ipc.invoke_handler())
        .setup(move |app| {
            ipc.mount_events(app);
            app.manage(Session::new(app.path().app_config_dir()?));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
