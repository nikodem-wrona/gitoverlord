//! Connects a local repository to GitHub: its GitHub remote, and the token for `git`.

use git_core::{Branch, HostToken, Remote};

use crate::RepoId;

/// The remote that has precedence when a repository has more than one GitHub remote.
const PREFERRED_REMOTE: &str = "origin";

/// The token for the HTTPS remotes on `github.com`.
pub fn host_token(token: String) -> HostToken {
    HostToken {
        host: "github.com".to_owned(),
        username: "x-access-token".to_owned(),
        secret: token,
    }
}

/// Finds the GitHub remote: `origin` when it is on GitHub, else the first remote on GitHub.
/// Returns the name of the remote and its repository.
pub fn github_remote(remotes: &[Remote]) -> Option<(String, RepoId)> {
    let on_github = |remote: &Remote| {
        let id = RepoId::from_url(remote.url.as_deref()?)?;
        Some((remote.name.clone(), id))
    };
    let preferred = remotes
        .iter()
        .find(|remote| remote.name == PREFERRED_REMOTE);
    preferred
        .and_then(on_github)
        .or_else(|| remotes.iter().find_map(on_github))
}

/// The name of the upstream branch of `branch` on the remote `remote`.
/// Returns `None` when the upstream is on another remote, or when there is no upstream.
pub fn branch_on_remote(branch: &Branch, remote: &str) -> Option<String> {
    let upstream = branch.upstream.as_deref()?;
    let name = upstream.strip_prefix(remote)?.strip_prefix('/')?;
    Some(name.to_owned())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn remote(name: &str, url: &str) -> Remote {
        Remote {
            name: name.to_owned(),
            url: Some(url.to_owned()),
            branches: Vec::new(),
        }
    }

    #[test]
    fn prefers_origin_and_skips_other_hosts() {
        let remotes = [
            remote("backup", "https://gitlab.com/o/r.git"),
            remote("fork", "git@github.com:me/r.git"),
            remote("origin", "https://github.com/o/r.git"),
        ];

        let (name, id) = github_remote(&remotes).unwrap();
        assert_eq!((name.as_str(), id.full_name().as_str()), ("origin", "o/r"));

        let (name, _) = github_remote(&remotes[..2]).unwrap();
        assert_eq!(name, "fork");
        assert_eq!(github_remote(&remotes[..1]), None);
    }

    #[test]
    fn names_the_upstream_branch_on_the_remote() {
        let branch = Branch {
            name: "feat/sync".to_owned(),
            current: true,
            upstream: Some("origin/feat/sync".to_owned()),
            ahead: 0,
            behind: 0,
            tip: String::new(),
            updated: 0,
        };

        assert_eq!(
            branch_on_remote(&branch, "origin").as_deref(),
            Some("feat/sync")
        );
        assert_eq!(branch_on_remote(&branch, "fork"), None);
        assert_eq!(branch_on_remote(&branch, "orig"), None);
    }
}
