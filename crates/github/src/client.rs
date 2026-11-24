//! The HTTP client for the GitHub API and the GitHub sign-in.

use std::time::Duration;

use git_core::GitError;
use serde::Serialize;
use serde::de::DeserializeOwned;
use ureq::http::Response;
use ureq::{Agent, Body, RequestBuilder};

const API_HOST: &str = "https://api.github.com";
const WEB_HOST: &str = "https://github.com";
const TIMEOUT: Duration = Duration::from_secs(30);
const API_VERSION: (&str, &str) = ("X-GitHub-Api-Version", "2022-11-28");

/// Sends requests to GitHub. The token, when there is one, signs each API request.
pub struct GitHub {
    agent: Agent,
    api: String,
    web: String,
    token: Option<String>,
}

/// The error text in an answer of GitHub.
#[derive(serde::Deserialize, Default)]
struct ErrorAnswer {
    #[serde(default)]
    message: String,
    #[serde(default)]
    errors: Vec<ErrorDetail>,
}

#[derive(serde::Deserialize)]
struct ErrorDetail {
    message: Option<String>,
}

impl GitHub {
    pub fn new(token: Option<String>) -> Self {
        Self::with_hosts(API_HOST, WEB_HOST, token)
    }

    /// Uses other hosts, for example a local server in a test.
    pub(crate) fn with_hosts(api: &str, web: &str, token: Option<String>) -> Self {
        let config = Agent::config_builder()
            .http_status_as_error(false)
            .timeout_global(Some(TIMEOUT))
            .user_agent("gitoverlord")
            .build();
        Self {
            agent: config.into(),
            api: api.to_owned(),
            web: web.to_owned(),
            token,
        }
    }

    pub(crate) fn get<T: DeserializeOwned>(&self, path: &str) -> Result<T, GitError> {
        let request = self.agent.get(format!("{}{path}", self.api));
        read(self.sign(request).call())
    }

    pub(crate) fn post<T: DeserializeOwned>(
        &self,
        path: &str,
        body: &impl Serialize,
    ) -> Result<T, GitError> {
        let request = self.agent.post(format!("{}{path}", self.api));
        read(self.sign(request).send_json(body))
    }

    /// Posts a form to the web host, as the sign-in needs. The answer is JSON.
    pub(crate) fn post_form<T: DeserializeOwned>(
        &self,
        path: &str,
        form: &[(&str, &str)],
    ) -> Result<T, GitError> {
        let request = self.agent.post(format!("{}{path}", self.web));
        let request = request.header("Accept", "application/json");
        read(request.send_form(form.iter().copied()))
    }

    fn sign<B>(&self, request: RequestBuilder<B>) -> RequestBuilder<B> {
        let request = request
            .header("Accept", "application/vnd.github+json")
            .header(API_VERSION.0, API_VERSION.1);
        match &self.token {
            Some(token) => request.header("Authorization", format!("Bearer {token}")),
            None => request,
        }
    }
}

fn read<T: DeserializeOwned>(result: Result<Response<Body>, ureq::Error>) -> Result<T, GitError> {
    let mut response = result.map_err(|error| GitError::Service(error.to_string()))?;
    let status = response.status();
    let body = response.body_mut();
    if status.is_success() {
        return body
            .read_json()
            .map_err(|error| GitError::UnexpectedOutput(error.to_string()));
    }
    if status.as_u16() == 401 {
        return Err(GitError::SignInExpired);
    }
    let answer: ErrorAnswer = body.read_json().unwrap_or_default();
    let details = answer
        .errors
        .into_iter()
        .filter_map(|detail| detail.message);
    let text: Vec<String> = [answer.message].into_iter().chain(details).collect();
    Err(GitError::Rejected(format!(
        "GitHub answered {}: {}",
        status.as_u16(),
        text.join(". ")
    )))
}
