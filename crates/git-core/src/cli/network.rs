//! Runs the `git` commands that use the network, and reports their progress.
//!
//! `git` gets its credentials from the credential helper and the SSH agent of
//! the system. It must never wait for a password on a terminal that nobody sees.

use std::env;
use std::io::Read;
use std::path::Path;
use std::process::{Command, Stdio};
use std::thread;

use super::{git_command, progress, run_git_in, spawn_error};
use crate::GitError;
use crate::model::{HostToken, Progress};

/// Makes `git` fail when it needs a user name or a password from the terminal.
const NO_PROMPT: (&str, &str) = ("GIT_TERMINAL_PROMPT", "0");

/// Makes `ssh` fail when it needs a passphrase or the confirmation of a host key.
const BATCH_SSH: (&str, &str) = ("GIT_SSH_COMMAND", "ssh -o BatchMode=yes");

/// A credential helper that gives the token of the application. The token is in
/// the environment of the `git` process, so it is not on a command line.
const TOKEN_HELPER: &str = "!f() { if test \"$1\" = get; then \
    echo \"username=$GITOVERLORD_USERNAME\"; echo \"password=$GITOVERLORD_TOKEN\"; fi; }; f";

/// Parts of the messages of `git` and `ssh` when the remote refuses the access.
const AUTH_FAILURES: [&str; 5] = [
    "terminal prompts disabled",
    "Authentication failed",
    "Permission denied (publickey",
    "Host key verification failed",
    "could not read Username",
];

/// Runs `git` in `dir` with `args`. Each progress line goes to `progress`.
///
/// `args` must contain `--progress`, because the error output is not a terminal.
/// `token`, when it is there, signs in to the HTTPS remotes of its host.
pub(crate) fn run_network(
    dir: &Path,
    args: &[&str],
    token: Option<&HostToken>,
    progress: &mut dyn FnMut(Progress),
) -> Result<(), GitError> {
    let mut child = network_command(dir, token)
        .args(args)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(spawn_error)?;
    // A full output pipe would stop `git`, so another thread reads it.
    let output = child.stdout.take().map(|mut stdout| {
        thread::spawn(move || {
            let mut text = String::new();
            stdout.read_to_string(&mut text).map(|_| text)
        })
    });
    let messages = match child.stderr.take() {
        Some(stderr) => progress::read_output(stderr, progress)?,
        None => Vec::new(),
    };
    let status = child.wait()?;
    let output = output.and_then(|reader| reader.join().ok()?.ok());
    if status.success() {
        return Ok(());
    }
    Err(failure(&messages, output.as_deref().unwrap_or_default()))
}

fn network_command(dir: &Path, token: Option<&HostToken>) -> Command {
    let mut command = git_command();
    command.current_dir(dir).env(NO_PROMPT.0, NO_PROMPT.1);
    if !custom_ssh(dir) {
        command.env(BATCH_SSH.0, BATCH_SSH.1);
    }
    if let Some(token) = token {
        use_token(&mut command, token);
    }
    command
}

/// Makes the token the only credential for the HTTPS remotes of its host.
///
/// An empty helper removes the helpers of the user for that host, so that an
/// old password in the keychain does not replace the token.
fn use_token(command: &mut Command, token: &HostToken) {
    let key = format!("credential.https://{}.helper", token.host);
    command
        .args([
            "-c",
            &format!("{key}="),
            "-c",
            &format!("{key}={TOKEN_HELPER}"),
        ])
        .env("GITOVERLORD_USERNAME", &token.username)
        .env("GITOVERLORD_TOKEN", &token.secret);
}

/// Returns `true` when the user selected an SSH program. That program then stays.
fn custom_ssh(dir: &Path) -> bool {
    let from_environment = ["GIT_SSH_COMMAND", "GIT_SSH"]
        .iter()
        .any(|name| env::var_os(name).is_some());
    from_environment || run_git_in(dir, &["config", "--get", "core.sshCommand"]).is_ok()
}

/// Makes the error of a failed command. The hints of `git` name terminal commands, so they go.
fn failure(messages: &[String], output: &str) -> GitError {
    let lines: Vec<&str> = messages
        .iter()
        .map(String::as_str)
        .filter(|line| !line.starts_with("hint:"))
        .collect();
    let text = if lines.is_empty() {
        output.trim().to_owned()
    } else {
        lines.join("\n")
    };
    if AUTH_FAILURES.iter().any(|sign| text.contains(sign)) {
        GitError::AuthFailed(text)
    } else {
        GitError::CommandFailed(text)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn lines(list: &[&str]) -> Vec<String> {
        list.iter().map(|&line| line.to_owned()).collect()
    }

    #[test]
    fn removes_the_hints_from_the_error() {
        let messages = lines(&[
            "hint: Diverging branches can't be fast-forwarded.",
            "fatal: Not possible to fast-forward, aborting.",
        ]);

        let error = failure(&messages, "");

        let expected = "fatal: Not possible to fast-forward, aborting.";
        assert_eq!(error, GitError::CommandFailed(expected.to_owned()));
    }

    #[test]
    fn reports_a_refused_sign_in_as_an_authentication_failure() {
        let messages = lines(&[
            "git@github.com: Permission denied (publickey).",
            "fatal: Could not read from remote repository.",
        ]);

        assert!(matches!(failure(&messages, ""), GitError::AuthFailed(_)));
    }

    #[test]
    fn uses_the_standard_output_when_there_is_no_error_output() {
        let error = failure(&[], "Already up to date.\n");

        assert_eq!(error, GitError::CommandFailed("Already up to date.".into()));
    }

    #[test]
    fn runs_the_command_in_the_folder() {
        let dir = tempfile::tempdir().unwrap();
        let mut steps = Vec::new();

        let args = ["init", "--quiet"];
        run_network(dir.path(), &args, None, &mut |step| steps.push(step)).unwrap();

        assert!(steps.is_empty());
        assert!(dir.path().join(".git").is_dir());
    }

    /// Asks `git` for the credentials of `host`, as a fetch would.
    fn fill(token: &HostToken, host: &str) -> Result<String, GitError> {
        let dir = tempfile::tempdir().unwrap();
        let mut child = network_command(dir.path(), Some(token))
            .args(["credential", "fill"])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        let request = format!("protocol=https\nhost={host}\n\n");
        let mut stdin = child.stdin.take().unwrap();
        std::io::Write::write_all(&mut stdin, request.as_bytes()).unwrap();
        drop(stdin);
        super::super::finish(child.wait_with_output())
    }

    #[test]
    fn gives_the_token_to_the_https_remotes_of_its_host() {
        let token = HostToken {
            host: "github.com".into(),
            username: "x-access-token".into(),
            secret: "gho_secret".into(),
        };

        let filled = fill(&token, "github.com").unwrap();

        assert!(filled.contains("username=x-access-token"), "{filled}");
        assert!(filled.contains("password=gho_secret"), "{filled}");
        assert!(fill(&token, "example.com").is_err());
    }
}
