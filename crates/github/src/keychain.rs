//! Keeps the GitHub token in the keychain of the operating system.
//!
//! The token is never written to a file as plain text.

use git_core::GitError;
use keyring::{Entry, Error};

const SERVICE: &str = "gitoverlord";
const ACCOUNT: &str = "github";

/// Reads the token. Returns `None` when there is no token.
///
/// # Errors
///
/// Returns `GitError::Io` if the keychain is not available.
pub fn load_token() -> Result<Option<String>, GitError> {
    match entry()?.get_password() {
        Ok(token) => Ok(Some(token)),
        Err(Error::NoEntry) => Ok(None),
        Err(error) => Err(keychain_error(&error)),
    }
}

/// Writes the token. It replaces the token that was there.
///
/// # Errors
///
/// Returns `GitError::Io` if the keychain refuses the token.
pub fn save_token(token: &str) -> Result<(), GitError> {
    entry()?
        .set_password(token)
        .map_err(|error| keychain_error(&error))
}

/// Removes the token. It is not an error when there is no token.
///
/// # Errors
///
/// Returns `GitError::Io` if the keychain refuses the removal.
pub fn delete_token() -> Result<(), GitError> {
    match entry()?.delete_credential() {
        Ok(()) | Err(Error::NoEntry) => Ok(()),
        Err(error) => Err(keychain_error(&error)),
    }
}

fn entry() -> Result<Entry, GitError> {
    Entry::new(SERVICE, ACCOUNT).map_err(|error| keychain_error(&error))
}

fn keychain_error(error: &Error) -> GitError {
    GitError::Io(format!("the keychain failed: {error}"))
}
