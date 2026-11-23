//! Finds the GitHub repository of a remote URL.

use serde::Serialize;
use specta::Type;

const HOST: &str = "github.com";

/// The owner and the name of a repository on GitHub.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
pub struct RepoId {
    pub owner: String,
    pub name: String,
}

impl RepoId {
    /// Reads a GitHub URL, for example `https://github.com/owner/name.git`,
    /// `git@github.com:owner/name.git`, or `ssh://git@github.com/owner/name`.
    /// Returns `None` for another host.
    pub fn from_url(url: &str) -> Option<Self> {
        let rest = url
            .trim()
            .split_once("://")
            .map_or(url.trim(), |(_, rest)| rest);
        let rest = rest.rsplit_once('@').map_or(rest, |(_, host)| host);
        let after_host = rest.strip_prefix(HOST)?;
        // `github.com.example.org` is another host.
        let path = after_host.strip_prefix([':', '/'])?.trim_end_matches('/');
        let path = path.strip_suffix(".git").unwrap_or(path);
        let (owner, name) = path.split_once('/')?;
        let valid = |part: &str| !part.is_empty() && !part.contains('/');
        (valid(owner) && valid(name)).then(|| Self {
            owner: owner.to_owned(),
            name: name.to_owned(),
        })
    }

    pub fn full_name(&self) -> String {
        format!("{}/{}", self.owner, self.name)
    }
}

#[cfg(test)]
mod tests {
    use super::RepoId;

    #[test]
    fn reads_the_owner_and_the_name_of_each_url_form() {
        for url in [
            "https://github.com/octocat/hello.git",
            "https://github.com/octocat/hello/",
            "git@github.com:octocat/hello.git",
            "ssh://git@github.com/octocat/hello",
        ] {
            let id = RepoId::from_url(url).unwrap_or_else(|| panic!("{url}"));
            assert_eq!(id.full_name(), "octocat/hello", "{url}");
        }
    }

    #[test]
    fn rejects_other_hosts_and_other_paths() {
        for url in [
            "https://gitlab.com/octocat/hello.git",
            "https://github.com/octocat",
            "https://github.com/octocat/hello/tree/main",
            "/home/octocat/hello",
            "https://github.com.example.org/octocat/hello",
        ] {
            assert_eq!(RepoId::from_url(url), None, "{url}");
        }
    }
}
