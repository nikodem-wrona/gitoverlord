//! Access to the system `git` executable.

use std::io;
use std::process::Command;

use crate::GitError;

/// Runs the system `git` with `args` and returns its standard output.
pub(crate) fn run_git(args: &[&str]) -> Result<String, GitError> {
    let output = git_command().args(args).output().map_err(spawn_error)?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(GitError::CommandFailed(stderr.trim().to_owned()));
    }
    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}

/// Creates the base `git` command. Each `git` process starts here.
fn git_command() -> Command {
    let mut command = Command::new("git");
    hide_console_window(&mut command);
    command
}

/// Prevents a console window when a GUI application starts `git` on Windows.
#[cfg(windows)]
fn hide_console_window(command: &mut Command) {
    use std::os::windows::process::CommandExt;

    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    command.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(windows))]
fn hide_console_window(_command: &mut Command) {}

fn spawn_error(error: io::Error) -> GitError {
    match error.kind() {
        io::ErrorKind::NotFound => GitError::GitNotFound,
        _ => GitError::CommandFailed(error.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn returns_the_standard_output_of_git() {
        let output = run_git(&["--version"]).unwrap();

        assert!(output.starts_with("git version "), "output: {output}");
    }

    #[test]
    fn reports_the_error_output_when_git_fails() {
        let error = run_git(&["not-a-git-subcommand"]).unwrap_err();

        let GitError::CommandFailed(message) = error else {
            panic!("expected CommandFailed, got {error:?}");
        };
        assert!(
            message.contains("not-a-git-subcommand"),
            "message: {message}"
        );
    }

    #[test]
    fn maps_a_missing_executable_to_git_not_found() {
        let error = spawn_error(io::Error::from(io::ErrorKind::NotFound));

        assert_eq!(error, GitError::GitNotFound);
    }

    #[test]
    fn maps_other_spawn_failures_to_command_failed() {
        let error = spawn_error(io::Error::from(io::ErrorKind::PermissionDenied));

        assert!(matches!(error, GitError::CommandFailed(_)));
    }
}
