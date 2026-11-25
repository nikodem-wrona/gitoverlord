//! The client ID of the GitHub app for the sign-in.
//!
//! The user can save the client ID of an own OAuth app or GitHub App. The app
//! must have the device flow turned on.

use std::fs;
use std::path::PathBuf;

use git_core::GitError;
use serde::{Deserialize, Serialize};
use specta::Type;

/// The variable that replaces the client ID, for a build or a start with its own app.
const CLIENT_ID_VARIABLE: &str = "GITOVERLORD_GITHUB_CLIENT_ID";

/// The client ID of the gitoverlord OAuth app on GitHub. The app has the device
/// flow turned on. The client ID identifies the application and is not a secret.
const BUILT_IN_CLIENT_ID: &str = "Ov23liOLVhEKbxsuo0TU";

/// A client ID of GitHub is shorter, for example `Ov23liOLVhEKbxsuo0TU` or `Iv1.8a61f9b3a7aba766`.
const MAX_LENGTH: usize = 64;

/// Where the client ID of the sign-in comes from.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum ClientIdSource {
    /// `GITOVERLORD_GITHUB_CLIENT_ID` at run time. It replaces the saved client ID.
    Environment,
    /// The client ID that the user saved in the options.
    Saved,
    /// `GITOVERLORD_GITHUB_CLIENT_ID` at build time.
    Build,
    /// The gitoverlord OAuth app.
    BuiltIn,
}

/// The GitHub app of the sign-in.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct GitHubApp {
    /// The client ID that the sign-in uses.
    pub client_id: String,
    pub source: ClientIdSource,
    /// The client ID that the user saved. `None` when the user saved none.
    pub saved: Option<String>,
}

#[derive(Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SavedApp {
    client_id: Option<String>,
}

/// Keeps the client ID that the user saved in one JSON file.
#[derive(Debug)]
pub struct ClientIdStore {
    file: PathBuf,
}

impl ClientIdStore {
    #[must_use]
    pub fn new(file: impl Into<PathBuf>) -> Self {
        Self { file: file.into() }
    }

    /// The app of the sign-in. The variable at run time comes first, then the
    /// saved client ID, then the variable at build time, then the built-in client ID.
    #[must_use]
    pub fn app(&self) -> GitHubApp {
        let runtime = std::env::var(CLIENT_ID_VARIABLE).ok();
        let build = option_env!("GITOVERLORD_GITHUB_CLIENT_ID");
        choose_app(runtime.as_deref(), self.load(), build)
    }

    /// Saves `client_id`. `None` or an empty text removes the saved client ID.
    ///
    /// # Errors
    ///
    /// Returns `GitError::Rejected` for a text that is not a client ID, and
    /// `GitError::Io` if the file cannot be written.
    pub fn save(&self, client_id: Option<&str>) -> Result<GitHubApp, GitError> {
        let client_id = client_id
            .and_then(non_empty)
            .map(checked_client_id)
            .transpose()?;
        if let Some(folder) = self.file.parent() {
            fs::create_dir_all(folder)?;
        }
        let content = serde_json::to_string_pretty(&SavedApp { client_id })
            .map_err(|error| GitError::Io(error.to_string()))?;
        fs::write(&self.file, content)?;
        Ok(self.app())
    }

    /// A missing file or a file with bad content gives `None`.
    fn load(&self) -> Option<String> {
        let content = fs::read_to_string(&self.file).unwrap_or_default();
        let saved: SavedApp = serde_json::from_str(&content).unwrap_or_default();
        saved
            .client_id
            .as_deref()
            .and_then(non_empty)
            .map(str::to_owned)
    }
}

/// The first client ID that has a value. An empty text does not count.
fn choose_app(runtime: Option<&str>, saved: Option<String>, build: Option<&str>) -> GitHubApp {
    let candidates = [
        (runtime, ClientIdSource::Environment),
        (saved.as_deref(), ClientIdSource::Saved),
        (build, ClientIdSource::Build),
    ];
    let (client_id, source) = candidates
        .into_iter()
        .find_map(|(id, source)| id.and_then(non_empty).map(|id| (id, source)))
        .unwrap_or((BUILT_IN_CLIENT_ID, ClientIdSource::BuiltIn));
    GitHubApp {
        client_id: client_id.to_owned(),
        source,
        saved,
    }
}

fn non_empty(text: &str) -> Option<&str> {
    Some(text.trim()).filter(|text| !text.is_empty())
}

/// A client ID has only letters, digits, and dots.
fn checked_client_id(client_id: &str) -> Result<String, GitError> {
    let valid = client_id.len() <= MAX_LENGTH
        && client_id
            .chars()
            .all(|char| char.is_ascii_alphanumeric() || char == '.');
    if valid {
        Ok(client_id.to_owned())
    } else {
        Err(GitError::Rejected(format!(
            "{client_id} is not a client ID. Copy the client ID from the settings of the app on GitHub."
        )))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn store_in(root: &tempfile::TempDir) -> ClientIdStore {
        ClientIdStore::new(root.path().join("state/github.json"))
    }

    #[test]
    fn uses_the_built_in_client_id_without_a_value() {
        let app = choose_app(None, None, None);
        assert_eq!(app.client_id, BUILT_IN_CLIENT_ID);
        assert_eq!(app.source, ClientIdSource::BuiltIn);

        let app = choose_app(Some(""), Some(" ".into()), Some(" "));
        assert_eq!(app.source, ClientIdSource::BuiltIn);
    }

    #[test]
    fn prefers_run_time_then_saved_then_build_time() {
        let saved = || Some("saved".to_owned());
        assert_eq!(
            choose_app(Some("run"), saved(), Some("build")).source,
            ClientIdSource::Environment
        );
        let app = choose_app(Some(""), saved(), Some("build"));
        assert_eq!(
            (app.client_id.as_str(), app.source),
            ("saved", ClientIdSource::Saved)
        );
        assert_eq!(
            choose_app(None, None, Some("build")).source,
            ClientIdSource::Build
        );
    }

    #[test]
    fn saves_and_removes_the_client_id() {
        let root = tempfile::tempdir().unwrap();
        let store = store_in(&root);
        assert_eq!(store.load(), None);

        let app = store.save(Some(" Iv1.8a61f9b3a7aba766 ")).unwrap();
        assert_eq!(app.saved.as_deref(), Some("Iv1.8a61f9b3a7aba766"));
        assert_eq!(store.load().as_deref(), Some("Iv1.8a61f9b3a7aba766"));

        assert_eq!(store.save(Some("")).unwrap().saved, None);
        assert_eq!(store.load(), None);
    }

    #[test]
    fn refuses_a_text_that_is_not_a_client_id() {
        let root = tempfile::tempdir().unwrap();
        let store = store_in(&root);
        store.save(Some("Ov23liOLVhEKbxsuo0TU")).unwrap();

        for text in ["has space", "a/b", &"x".repeat(MAX_LENGTH + 1)] {
            let error = store.save(Some(text)).unwrap_err();
            assert!(matches!(error, GitError::Rejected(_)), "{text}");
        }
        assert_eq!(store.load().as_deref(), Some("Ov23liOLVhEKbxsuo0TU"));
    }

    #[test]
    fn ignores_a_file_with_bad_content() {
        let root = tempfile::tempdir().unwrap();
        fs::create_dir_all(root.path().join("state")).unwrap();
        fs::write(root.path().join("state/github.json"), "not json").unwrap();

        assert_eq!(store_in(&root).load(), None);
    }
}
