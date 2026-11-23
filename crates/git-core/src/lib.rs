//! Git access for gitoverlord.
//!
//! This crate does not depend on Tauri. The Tauri shell calls it and sends
//! the results to the user interface.

mod cli;
mod error;
mod version;

pub use error::GitError;
pub use version::GitVersion;
