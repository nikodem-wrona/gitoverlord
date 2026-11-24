//! The sign-in with the OAuth device flow.
//!
//! The application shows a code. The user types it on GitHub, and the
//! application polls until GitHub gives the token.

use git_core::GitError;
use serde::{Deserialize, Serialize};
use specta::Type;

use crate::{Account, GitHub};

/// The scope of the token: read and write access to the repositories of the user.
const SCOPE: &str = "repo";
const GRANT_TYPE: &str = "urn:ietf:params:oauth:grant-type:device_code";

/// The codes of a sign-in that started.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct DeviceCode {
    /// The code that the user types on GitHub, for example `WDJB-MJHT`.
    pub user_code: String,
    /// The page where the user types the code.
    pub verification_uri: String,
    /// Identifies this sign-in when the application polls.
    pub device_code: String,
    /// The seconds between two polls.
    pub interval: u32,
    /// The seconds until the codes expire.
    pub expires_in: u32,
}

/// The state of a sign-in after one poll.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Poll {
    /// The user did not type the code yet.
    Pending,
    /// The application polls too fast. Add 5 seconds to the interval.
    SlowDown,
    Expired,
    /// The user refused the access.
    Denied,
    Token(String),
}

/// The state of a sign-in for the user interface. The token stays in the backend.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(tag = "kind", content = "account", rename_all = "camelCase")]
pub enum SignInStep {
    Pending,
    /// Poll more slowly: add 5 seconds to the interval.
    SlowDown,
    Expired,
    Denied,
    Done(Account),
}

#[derive(Deserialize)]
struct CodeAnswer {
    user_code: String,
    verification_uri: String,
    device_code: String,
    interval: u32,
    expires_in: u32,
}

#[derive(Deserialize)]
struct TokenAnswer {
    access_token: Option<String>,
    error: Option<String>,
    error_description: Option<String>,
}

impl GitHub {
    /// Starts a sign-in for the OAuth app `client_id`.
    pub fn start_sign_in(&self, client_id: &str) -> Result<DeviceCode, GitError> {
        let form = [("client_id", client_id), ("scope", SCOPE)];
        let answer: CodeAnswer = self.post_form("/login/device/code", &form)?;
        Ok(DeviceCode {
            user_code: answer.user_code,
            verification_uri: answer.verification_uri,
            device_code: answer.device_code,
            interval: answer.interval,
            expires_in: answer.expires_in,
        })
    }

    /// Asks GitHub one time if the user typed the code.
    pub fn poll_sign_in(&self, client_id: &str, device_code: &str) -> Result<Poll, GitError> {
        let form = [
            ("client_id", client_id),
            ("device_code", device_code),
            ("grant_type", GRANT_TYPE),
        ];
        let answer: TokenAnswer = self.post_form("/login/oauth/access_token", &form)?;
        if let Some(token) = answer.access_token {
            return Ok(Poll::Token(token));
        }
        match answer.error.as_deref() {
            Some("authorization_pending") => Ok(Poll::Pending),
            Some("slow_down") => Ok(Poll::SlowDown),
            Some("expired_token" | "incorrect_device_code") => Ok(Poll::Expired),
            Some("access_denied") => Ok(Poll::Denied),
            other => Err(GitError::Rejected(
                answer
                    .error_description
                    .or(other.map(str::to_owned))
                    .unwrap_or_else(|| "GitHub did not give a token.".to_owned()),
            )),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_server::serve;

    #[test]
    fn starts_a_sign_in_with_the_client_id_and_the_scope() {
        let server = serve(vec![(
            200,
            r#"{"device_code":"d1","user_code":"WDJB-MJHT","verification_uri":"https://github.com/login/device","expires_in":899,"interval":5}"#,
        )]);

        let code = server.client(None).start_sign_in("client-1").unwrap();

        assert_eq!(code.user_code, "WDJB-MJHT");
        assert_eq!((code.interval, code.expires_in), (5, 899));
        let request = server.request();
        assert_eq!(request.path, "/login/device/code");
        assert_eq!(request.body, "client_id=client-1&scope=repo");
    }

    #[test]
    fn reads_each_state_of_a_poll() {
        let server = serve(vec![
            (200, r#"{"error":"authorization_pending"}"#),
            (200, r#"{"error":"slow_down"}"#),
            (200, r#"{"error":"access_denied"}"#),
            (200, r#"{"access_token":"gho_1","token_type":"bearer"}"#),
        ]);
        let client = server.client(None);

        let polls: Vec<_> = (0..4)
            .map(|_| client.poll_sign_in("client-1", "d1").unwrap())
            .collect();

        let expected = [Poll::Pending, Poll::SlowDown, Poll::Denied];
        assert_eq!(polls[..3], expected);
        assert_eq!(polls[3], Poll::Token("gho_1".to_owned()));
    }

    #[test]
    fn reports_an_app_without_the_device_flow() {
        let server = serve(vec![(
            200,
            r#"{"error":"device_flow_disabled","error_description":"Device Flow must be enabled"}"#,
        )]);

        let error = server.client(None).poll_sign_in("c", "d").unwrap_err();

        assert_eq!(
            error,
            GitError::Rejected("Device Flow must be enabled".into())
        );
    }
}
