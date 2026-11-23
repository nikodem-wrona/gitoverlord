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

/// The variable that gives the client ID of the GitHub OAuth app.
const CLIENT_ID_VARIABLE: &str = "GITOVERLORD_GITHUB_CLIENT_ID";

/// The client ID of the GitHub OAuth app, from the environment or from the build.
///
/// The sign-in needs an OAuth app with the device flow turned on. Without a
/// client ID, the sign-in is not available.
pub fn client_id() -> Option<String> {
    let runtime = std::env::var(CLIENT_ID_VARIABLE).ok();
    let build = option_env!("GITOVERLORD_GITHUB_CLIENT_ID").map(str::to_owned);
    runtime.or(build).filter(|id| !id.trim().is_empty())
}
