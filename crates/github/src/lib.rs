//! GitHub access for gitoverlord: the sign-in, the API, and the token in the keychain.
//!
//! This crate does not depend on Tauri. Each failure is a `GitError`, so that the
//! user interface has one error type.

mod account;
mod client;
mod device;
mod keychain;
mod pulls;
mod repo_id;
mod repo_links;
#[cfg(test)]
mod test_server;

pub use account::{Account, HubRepository};
pub use client::GitHub;
pub use device::{DeviceCode, Poll, SignInStep};
pub use keychain::{delete_token, load_token, save_token};
pub use pulls::{Checks, CreatedPull, PullList, PullRequest};
pub use repo_id::RepoId;
pub use repo_links::{branch_on_remote, github_remote, host_token};

/// The variable that replaces the built-in client ID, for a build with its own OAuth app.
const CLIENT_ID_VARIABLE: &str = "GITOVERLORD_GITHUB_CLIENT_ID";

/// The client ID of the gitoverlord OAuth app on GitHub. The app has the device
/// flow turned on. The client ID identifies the application and is not a secret.
const BUILT_IN_CLIENT_ID: &str = "Ov23liOLVhEKbxsuo0TU";

/// The client ID of the GitHub OAuth app for the sign-in.
///
/// The variable at run time comes first, then the variable at build time, then
/// the built-in client ID.
pub fn client_id() -> String {
    let runtime = std::env::var(CLIENT_ID_VARIABLE).ok();
    let build = option_env!("GITOVERLORD_GITHUB_CLIENT_ID");
    choose_client_id(runtime.as_deref(), build).to_owned()
}

/// The first client ID that has a value. An empty variable does not count.
fn choose_client_id<'a>(runtime: Option<&'a str>, build: Option<&'a str>) -> &'a str {
    [runtime, build]
        .into_iter()
        .flatten()
        .map(str::trim)
        .find(|id| !id.is_empty())
        .unwrap_or(BUILT_IN_CLIENT_ID)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn uses_the_built_in_client_id_without_a_variable() {
        assert_eq!(choose_client_id(None, None), BUILT_IN_CLIENT_ID);
        assert_eq!(choose_client_id(Some(""), Some(" ")), BUILT_IN_CLIENT_ID);
    }

    #[test]
    fn prefers_the_variable_at_run_time_then_at_build_time() {
        assert_eq!(choose_client_id(Some("run"), Some("build")), "run");
        assert_eq!(choose_client_id(Some(""), Some("build")), "build");
    }
}
