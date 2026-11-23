//! The open pull requests of a repository, and a new pull request.

use git_core::GitError;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use specta::Type;

use crate::{GitHub, RepoId};

/// One query reads the pull requests with the state of their checks.
const QUERY: &str = "query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    defaultBranchRef { name }
    pullRequests(states: OPEN, first: 50, orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes {
        number title url isDraft updatedAt headRefName baseRefName
        author { login }
        commits(last: 1) { nodes { commit { statusCheckRollup { state } } } }
      }
    }
  }
}";

/// The combined state of the checks and the statuses of the newest commit.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum Checks {
    Passing,
    Failing,
    Pending,
    /// The commit has no checks.
    None,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct PullRequest {
    pub number: u32,
    pub title: String,
    /// The page of the pull request on GitHub.
    pub url: String,
    pub author: String,
    /// The branch with the changes.
    pub head: String,
    /// The branch that the changes go into.
    pub base: String,
    pub draft: bool,
    /// The time of the last change, in the ISO 8601 format.
    pub updated_at: String,
    pub checks: Checks,
}

/// The open pull requests of one repository. The most recently changed is first.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct PullList {
    pub repository: RepoId,
    /// The branch that a new pull request goes into, for example `main`.
    pub default_branch: String,
    pub pulls: Vec<PullRequest>,
}

/// A pull request that the application opened.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
pub struct CreatedPull {
    pub number: u32,
    /// The page of the pull request on GitHub.
    pub url: String,
}

#[derive(Deserialize)]
struct CreatedAnswer {
    number: u32,
    html_url: String,
}

impl GitHub {
    pub fn pull_requests(&self, repository: &RepoId) -> Result<PullList, GitError> {
        let variables = json!({ "owner": repository.owner, "name": repository.name });
        let answer: Value = self.post(
            "/graphql",
            &json!({ "query": QUERY, "variables": variables }),
        )?;
        let Some(data) = answer
            .pointer("/data/repository")
            .filter(|data| !data.is_null())
        else {
            return Err(GitError::Rejected(format!(
                "GitHub has no repository {}, or your account cannot read it.",
                repository.full_name()
            )));
        };
        let nodes = data
            .pointer("/pullRequests/nodes")
            .and_then(Value::as_array);
        Ok(PullList {
            repository: repository.clone(),
            default_branch: text(data, "/defaultBranchRef/name"),
            pulls: nodes
                .into_iter()
                .flatten()
                .filter_map(pull_request)
                .collect(),
        })
    }

    /// Opens a pull request from the branch `head` into the branch `base`.
    pub fn create_pull_request(
        &self,
        repository: &RepoId,
        title: &str,
        head: &str,
        base: &str,
    ) -> Result<CreatedPull, GitError> {
        let path = format!("/repos/{}/pulls", repository.full_name());
        let body = json!({ "title": title, "head": head, "base": base });
        let created: CreatedAnswer = self.post(&path, &body)?;
        Ok(CreatedPull {
            number: created.number,
            url: created.html_url,
        })
    }
}

fn pull_request(node: &Value) -> Option<PullRequest> {
    let state = node.pointer("/commits/nodes/0/commit/statusCheckRollup/state");
    Some(PullRequest {
        number: u32::try_from(node.get("number")?.as_u64()?).ok()?,
        title: text(node, "/title"),
        url: text(node, "/url"),
        author: text(node, "/author/login"),
        head: text(node, "/headRefName"),
        base: text(node, "/baseRefName"),
        draft: node
            .get("isDraft")
            .and_then(Value::as_bool)
            .unwrap_or(false),
        updated_at: text(node, "/updatedAt"),
        checks: checks(state.and_then(Value::as_str)),
    })
}

fn checks(state: Option<&str>) -> Checks {
    match state {
        Some("SUCCESS") => Checks::Passing,
        Some("FAILURE" | "ERROR") => Checks::Failing,
        Some("PENDING" | "EXPECTED") => Checks::Pending,
        _ => Checks::None,
    }
}

fn text(value: &Value, pointer: &str) -> String {
    let found = value.pointer(pointer).and_then(Value::as_str);
    found.unwrap_or_default().to_owned()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_server::serve;

    const ANSWER: &str = r#"{"data":{"repository":{"defaultBranchRef":{"name":"main"},"pullRequests":{"nodes":[
      {"number":12,"title":"Add sync","url":"https://github.com/o/r/pull/12","isDraft":false,"updatedAt":"2026-11-23T10:00:00Z","headRefName":"feat/sync","baseRefName":"main","author":{"login":"octocat"},"commits":{"nodes":[{"commit":{"statusCheckRollup":{"state":"FAILURE"}}}]}},
      {"number":11,"title":"Draft","url":"u","isDraft":true,"updatedAt":"2026-11-22T10:00:00Z","headRefName":"x","baseRefName":"main","author":null,"commits":{"nodes":[{"commit":{"statusCheckRollup":null}}]}}
    ]}}}}"#;

    fn repo() -> RepoId {
        RepoId::from_url("https://github.com/o/r").unwrap()
    }

    #[test]
    fn reads_the_pull_requests_with_their_checks() {
        let server = serve(vec![(200, ANSWER)]);

        let list = server.client(Some("t")).pull_requests(&repo()).unwrap();

        assert_eq!(list.default_branch, "main");
        let numbers: Vec<_> = list.pulls.iter().map(|pull| pull.number).collect();
        assert_eq!(numbers, [12, 11]);
        assert_eq!(list.pulls[0].checks, Checks::Failing);
        assert_eq!(list.pulls[0].head, "feat/sync");
        assert_eq!(
            (list.pulls[1].checks, list.pulls[1].draft),
            (Checks::None, true)
        );
        let body: Value = serde_json::from_str(&server.request().body).unwrap();
        assert_eq!(body["variables"]["owner"], "o");
    }

    #[test]
    fn rejects_a_repository_that_the_account_cannot_read() {
        let server = serve(vec![(200, r#"{"data":{"repository":null},"errors":[]}"#)]);

        let error = server.client(Some("t")).pull_requests(&repo()).unwrap_err();

        assert!(matches!(error, GitError::Rejected(text) if text.contains("o/r")));
    }

    #[test]
    fn creates_a_pull_request() {
        let server = serve(vec![(
            201,
            r#"{"number":13,"html_url":"https://github.com/o/r/pull/13"}"#,
        )]);

        let created =
            server
                .client(Some("t"))
                .create_pull_request(&repo(), "Add sync", "feat/sync", "main");

        let created = created.unwrap();
        assert_eq!(created.number, 13);
        assert_eq!(created.url, "https://github.com/o/r/pull/13");
        let request = server.request();
        assert_eq!(request.path, "/repos/o/r/pulls");
        let body: Value = serde_json::from_str(&request.body).unwrap();
        assert_eq!(body["head"], "feat/sync");
    }
}
