//! GitHub access for gitoverlord: the sign-in, the API, and the token in the keychain.
//!
//! This crate does not depend on Tauri. Each failure is a `GitError`, so that the
//! user interface has one error type.

mod account;
mod client;
mod client_id;
mod device;
mod keychain;
mod pulls;
mod repo_id;
mod repo_links;
#[cfg(test)]
mod test_server;

pub use account::{Account, HubRepository};
pub use client::GitHub;
pub use client_id::{ClientIdSource, ClientIdStore, GitHubApp};
pub use device::{DeviceCode, Poll, SignInStep};
pub use keychain::{delete_token, load_token, save_token};
pub use pulls::{Checks, CreatedPull, PullList, PullRequest};
pub use repo_id::RepoId;
pub use repo_links::{branch_on_remote, github_remote, host_token};
