//! Clones a remote repository into a new folder.

use std::path::{Path, PathBuf};

use crate::GitError;
use crate::cli::remote;
use crate::model::{HostToken, Progress};

/// Returns the folder for a clone of `url` in `parent`. The name comes from the URL, as in `git clone`.
///
/// # Errors
///
/// Returns `GitError::Rejected` if the URL gives no folder name.
pub fn clone_target(url: &str, parent: &Path) -> Result<PathBuf, GitError> {
    let name = folder_name(url)
        .ok_or_else(|| GitError::Rejected(format!("\"{url}\" is not a repository URL.")))?;
    Ok(parent.join(name))
}

/// Clones `url` into the new folder `target`. Each progress line goes to `progress`.
/// `token`, when it is there, signs in to the HTTPS remotes of its host.
///
/// # Errors
///
/// Returns an error if `git` fails, for example when `target` is not empty.
/// Returns `GitError::AuthFailed` if the remote refuses the access.
pub fn clone_repo(
    url: &str,
    target: &Path,
    token: Option<&HostToken>,
    progress: &mut dyn FnMut(Progress),
) -> Result<(), GitError> {
    remote::clone(url.trim(), target, token, progress)
}

/// Takes the last part of the URL without `.git`, for example `repo` from `git@host:owner/repo.git`.
fn folder_name(url: &str) -> Option<&str> {
    let url = url.trim().trim_end_matches(['/', '\\']);
    let url = url.strip_suffix("/.git").unwrap_or(url);
    let url = url.strip_suffix(".git").unwrap_or(url);
    let name = url.rsplit(['/', '\\', ':']).next()?;
    let valid = !name.is_empty() && name != "." && name != ".." && !name.starts_with('-');
    valid.then_some(name)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fixture::RepoFixture;
    use crate::open_repo;

    #[test]
    fn takes_the_folder_name_from_the_url() {
        let cases = [
            ("https://github.com/owner/repo.git", "repo"),
            ("https://github.com/owner/repo/", "repo"),
            ("git@github.com:owner/repo.git", "repo"),
            ("/home/user/projects/repo/.git", "repo"),
            ("C:\\projects\\repo", "repo"),
        ];
        for (url, name) in cases {
            assert_eq!(folder_name(url), Some(name), "{url}");
        }
    }

    #[test]
    fn rejects_a_url_without_a_name() {
        for url in ["", "   ", "https://github.com/..", "/"] {
            let target = clone_target(url, Path::new("/tmp"));
            assert!(matches!(target, Err(GitError::Rejected(_))), "{url}");
        }
    }

    #[test]
    fn clones_a_repository_into_a_new_folder() {
        let source = RepoFixture::new().commit("a").with_origin();
        source.git(&["push", "--quiet", "origin", "main"]);
        let parent = tempfile::tempdir().unwrap();
        let url = source.origin().to_string_lossy().into_owned();

        let target = clone_target(&url, parent.path()).unwrap();
        clone_repo(&url, &target, None, &mut |_| {}).unwrap();

        assert_eq!(target, parent.path().join("origin"));
        assert!(target.join("a.txt").is_file());
        let branches = open_repo(&target).unwrap().branches().unwrap();
        assert_eq!(branches[0].upstream.as_deref(), Some("origin/main"));
    }
}
