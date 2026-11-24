//! Commands for the automatic update of the application.
//!
//! The updater reads `latest.json` of the newest GitHub release. It installs a
//! download only when its signature matches the public key in `tauri.conf.json`.

use git_core::GitError;
use serde::Serialize;
use specta::Type;
use tauri::AppHandle;
use tauri_plugin_updater::{Update, UpdaterExt};

const DEVELOPMENT_BUILD: &str =
    "A development build does not update. Install a release build to get updates.";
const NO_UPDATE: &str = "gitoverlord is up to date.";

/// A newer version of the application.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct AppUpdate {
    pub version: String,
    pub current_version: String,
}

/// Asks the release server for a newer version. `None` when this version is the newest.
#[tauri::command]
#[specta::specta]
pub async fn check_for_update(app: AppHandle) -> Result<Option<AppUpdate>, GitError> {
    let update = find_update(&app).await?;
    Ok(update.map(|update| AppUpdate {
        version: update.version,
        current_version: update.current_version,
    }))
}

/// Downloads and installs the newest version, then starts it.
///
/// On Windows, the installer closes the application itself.
#[tauri::command]
#[specta::specta]
pub async fn install_update(app: AppHandle) -> Result<(), GitError> {
    let update = find_update(&app)
        .await?
        .ok_or_else(|| GitError::Rejected(NO_UPDATE.to_owned()))?;
    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(service_error)?;
    app.restart()
}

async fn find_update(app: &AppHandle) -> Result<Option<Update>, GitError> {
    if cfg!(debug_assertions) {
        return Err(GitError::Rejected(DEVELOPMENT_BUILD.to_owned()));
    }
    app.updater()
        .map_err(service_error)?
        .check()
        .await
        .map_err(service_error)
}

fn service_error(error: tauri_plugin_updater::Error) -> GitError {
    GitError::Service(error.to_string())
}
