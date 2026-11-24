//! The account of the user and its repositories.

use git_core::GitError;
use serde::{Deserialize, Serialize};
use specta::Type;

use crate::GitHub;

/// The repositories that the clone list shows. GitHub gives the most recently pushed first.
const REPOSITORIES: &str =
    "/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member";

/// The GitHub account of the user.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct Account {
    pub login: String,
    /// The display name. `None` when the user did not set one.
    pub name: Option<String>,
}

/// A repository that the user can clone.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct HubRepository {
    /// For example `owner/name`.
    pub full_name: String,
    /// The HTTPS URL for a clone.
    pub clone_url: String,
    pub private: bool,
    pub description: Option<String>,
}

#[derive(Deserialize)]
struct RepositoryAnswer {
    full_name: String,
    clone_url: String,
    private: bool,
    description: Option<String>,
}

impl GitHub {
    /// Reads the account of the token.
    pub fn account(&self) -> Result<Account, GitError> {
        self.get("/user")
    }

    /// Reads the 100 repositories that the user pushed to most recently.
    pub fn repositories(&self) -> Result<Vec<HubRepository>, GitError> {
        let answers: Vec<RepositoryAnswer> = self.get(REPOSITORIES)?;
        let repositories = answers.into_iter().map(|answer| HubRepository {
            full_name: answer.full_name,
            clone_url: answer.clone_url,
            private: answer.private,
            description: answer.description,
        });
        Ok(repositories.collect())
    }
}

#[cfg(test)]
mod tests {
    use git_core::GitError;

    use crate::test_server::serve;

    #[test]
    fn reads_the_account_with_the_token() {
        let server = serve(vec![(200, r#"{"login":"octocat","name":null,"id":1}"#)]);

        let account = server.client(Some("gho_1")).account().unwrap();

        assert_eq!(account.login, "octocat");
        assert_eq!(account.name, None);
        let request = server.request();
        assert_eq!(request.path, "/user");
        assert_eq!(request.authorization.as_deref(), Some("Bearer gho_1"));
    }

    #[test]
    fn lists_the_repositories() {
        let server = serve(vec![(
            200,
            r#"[{"full_name":"octocat/hello","clone_url":"https://github.com/octocat/hello.git","private":true,"description":null,"id":7}]"#,
        )]);

        let repositories = server.client(Some("t")).repositories().unwrap();

        assert_eq!(repositories[0].full_name, "octocat/hello");
        assert!(repositories[0].private);
        assert!(server.request().path.starts_with("/user/repos?"));
    }

    #[test]
    fn asks_for_a_new_sign_in_when_the_token_is_not_valid() {
        let server = serve(vec![(401, r#"{"message":"Bad credentials"}"#)]);

        let error = server.client(Some("old")).account().unwrap_err();

        assert_eq!(error, GitError::SignInExpired);
    }
}
