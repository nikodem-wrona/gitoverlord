use std::str::FromStr;

use serde::Serialize;
use specta::Type;

use crate::{GitError, cli};

const VERSION_PREFIX: &str = "git version ";

/// The version of a `git` executable.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Type)]
pub struct GitVersion {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
}

impl GitVersion {
    /// Finds the version of the system `git`.
    ///
    /// # Errors
    ///
    /// Returns an error if `git` is not installed, if it fails, or if its
    /// output is not a version.
    pub fn detect() -> Result<Self, GitError> {
        cli::run_git(&["--version"])?.parse()
    }
}

impl FromStr for GitVersion {
    type Err = GitError;

    /// Reads the output of `git --version`, for example `git version 2.54.0`.
    ///
    /// A missing patch number is read as `0`.
    fn from_str(output: &str) -> Result<Self, Self::Err> {
        let unexpected = || GitError::UnexpectedOutput(output.trim().to_owned());
        let numbers = output
            .trim()
            .strip_prefix(VERSION_PREFIX)
            .and_then(|rest| rest.split_whitespace().next())
            .ok_or_else(unexpected)?;
        let mut parts = numbers.split('.').map(str::parse::<u32>);
        let mut next_part = || parts.next().and_then(Result::ok);

        Ok(Self {
            major: next_part().ok_or_else(unexpected)?,
            minor: next_part().ok_or_else(unexpected)?,
            patch: next_part().unwrap_or(0),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn version(major: u32, minor: u32, patch: u32) -> GitVersion {
        GitVersion {
            major,
            minor,
            patch,
        }
    }

    #[test]
    fn reads_the_plain_format() {
        assert_eq!("git version 2.39.5\n".parse(), Ok(version(2, 39, 5)));
    }

    #[test]
    fn reads_the_apple_format() {
        let output = "git version 2.54.0 (Apple Git-157)\n";

        assert_eq!(output.parse(), Ok(version(2, 54, 0)));
    }

    #[test]
    fn reads_the_windows_format() {
        let output = "git version 2.43.0.windows.1\n";

        assert_eq!(output.parse(), Ok(version(2, 43, 0)));
    }

    #[test]
    fn reads_a_missing_patch_number_as_zero() {
        assert_eq!("git version 2.9".parse(), Ok(version(2, 9, 0)));
    }

    #[test]
    fn rejects_output_without_the_version_prefix() {
        let result = "fatal: not a command".parse::<GitVersion>();

        assert_eq!(
            result,
            Err(GitError::UnexpectedOutput("fatal: not a command".into()))
        );
    }

    #[test]
    fn rejects_a_version_without_a_minor_number() {
        let result = "git version 2".parse::<GitVersion>();

        assert!(matches!(result, Err(GitError::UnexpectedOutput(_))));
    }

    #[test]
    fn orders_versions_by_major_then_minor_then_patch() {
        assert!(version(2, 54, 0) > version(2, 9, 9));
    }
}
