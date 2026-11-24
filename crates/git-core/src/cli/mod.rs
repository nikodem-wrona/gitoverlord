//! Access to the system `git` executable.
//!
//! Each write operation runs `git`, so hooks, signing, and the configuration of
//! the user apply.

pub(crate) mod branch;
pub(crate) mod commit;
mod network;
mod progress;
pub(crate) mod remote;
pub(crate) mod reset;
pub(crate) mod resolve;
pub(crate) mod sequence;
pub(crate) mod stage;
pub(crate) mod stash;

use std::io::{self, Write};
use std::path::Path;
use std::process::{Command, Output, Stdio};

use crate::GitError;

/// Makes each path a file name, not a pattern. Put it before the subcommand.
pub(crate) const LITERAL_PATHS: &str = "--literal-pathspecs";

/// Reads the paths from the standard input. A NUL byte ends each path.
pub(crate) const PATHS_FROM_INPUT: [&str; 2] = ["--pathspec-from-file=-", "--pathspec-file-nul"];

/// Runs the system `git` with `args` and returns its standard output.
pub(crate) fn run_git(args: &[&str]) -> Result<String, GitError> {
    finish(git_command().args(args).output())
}

/// Runs `git` in the working tree `dir`.
pub(crate) fn run_git_in(dir: &Path, args: &[&str]) -> Result<String, GitError> {
    finish(git_command().current_dir(dir).args(args).output())
}

/// Runs `git` in `dir` and writes `input` to its standard input.
pub(crate) fn run_git_with_input(
    dir: &Path,
    args: &[&str],
    input: &[u8],
) -> Result<String, GitError> {
    let mut child = git_command()
        .current_dir(dir)
        .args(args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(spawn_error)?;
    // The input closes when it is dropped, so `git` can finish.
    let written = child.stdin.take().map(|mut stdin| stdin.write_all(input));
    let output = finish(child.wait_with_output())?;
    written.transpose()?;
    Ok(output)
}

/// Runs `git` in `dir` on the files `paths`. `args` must contain `PATHS_FROM_INPUT`.
///
/// The paths go through the standard input, so a long list does not make the
/// command line too long.
pub(crate) fn run_git_on_paths(
    dir: &Path,
    args: &[&str],
    paths: &[String],
) -> Result<(), GitError> {
    if paths.is_empty() {
        return Ok(());
    }
    let input: Vec<u8> = paths
        .iter()
        .flat_map(|path| path.bytes().chain([0]))
        .collect();
    run_git_with_input(dir, args, &input).map(drop)
}

/// Creates the base `git` command. Each `git` process starts here.
pub(crate) fn git_command() -> Command {
    let mut command = Command::new("git");
    // There is no terminal for an editor. `true` accepts the message that `git` proposes,
    // for example when a merge or a rebase continues.
    command.env("GIT_EDITOR", "true");
    hide_console_window(&mut command);
    command
}

/// Rejects a name of a branch or a commit that `git` would read as an option.
pub(crate) fn checked_name(name: &str) -> Result<&str, GitError> {
    if name.trim().is_empty() || name.starts_with('-') {
        return Err(GitError::Rejected(format!(
            "\"{name}\" is not a valid branch or commit name."
        )));
    }
    Ok(name)
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

fn finish(result: io::Result<Output>) -> Result<String, GitError> {
    let output = result.map_err(spawn_error)?;
    if !output.status.success() {
        return Err(GitError::CommandFailed(failure_text(&output)));
    }
    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}

/// Some commands, such as `git commit`, give the reason of a failure on the standard output.
fn failure_text(output: &Output) -> String {
    let stderr = String::from_utf8_lossy(&output.stderr);
    let text = if stderr.trim().is_empty() {
        String::from_utf8_lossy(&output.stdout)
    } else {
        stderr
    };
    text.trim().to_owned()
}

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
    fn writes_the_input_to_git() {
        let dir = tempfile::tempdir().unwrap();

        let output = run_git_with_input(dir.path(), &["hash-object", "--stdin"], b"text\n");

        assert_eq!(
            output.unwrap().trim(),
            "8e27be7d6154a1f68ea9160ef0e18691d20560dc"
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
