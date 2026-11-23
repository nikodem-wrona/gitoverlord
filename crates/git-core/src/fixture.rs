//! Builds real repositories in temporary folders for tests.

use std::fs;
use std::path::PathBuf;

use git2::Repository;
use tempfile::TempDir;

use crate::cli::git_command;
use crate::{GitBackend, open_repo};

/// The time of the first commit, in Unix seconds. Each commit is one minute later.
pub(crate) const FIRST_COMMIT_TIME: i64 = 1_700_000_000;
const COMMIT_INTERVAL: i64 = 60;

/// A temporary repository. The folder is deleted when this value is dropped.
pub(crate) struct RepoFixture {
    root: TempDir,
    commits: i64,
}

impl RepoFixture {
    /// Creates an empty repository on the branch `main`.
    pub(crate) fn new() -> Self {
        let root = tempfile::tempdir().expect("failed to create a temporary folder");
        fs::create_dir(root.path().join("repo")).unwrap();
        fs::write(root.path().join("gitconfig"), "").unwrap();
        let fixture = Self { root, commits: 0 };
        fixture.git(&["init", "--initial-branch=main"]);
        fixture
    }

    pub(crate) fn path(&self) -> PathBuf {
        self.root.path().join("repo")
    }

    pub(crate) fn backend(&self) -> Box<dyn GitBackend> {
        open_repo(&self.path()).unwrap()
    }

    pub(crate) fn repository(&self) -> Repository {
        Repository::open(self.path()).unwrap()
    }

    /// Writes a file in the working tree. Missing folders are created.
    pub(crate) fn write(self, file: &str, content: &str) -> Self {
        let path = self.path().join(file);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, content).unwrap();
        self
    }

    pub(crate) fn remove(self, file: &str) -> Self {
        fs::remove_file(self.path().join(file)).unwrap();
        self
    }

    pub(crate) fn stage(self, file: &str) -> Self {
        self.git(&["add", "--", file]);
        self
    }

    /// Adds the file `<message>.txt` and commits each change in the working tree.
    pub(crate) fn commit(self, message: &str) -> Self {
        let fixture = self.write(&format!("{message}.txt"), &format!("{message}\n"));
        fixture.save(message)
    }

    /// Commits each change in the working tree.
    pub(crate) fn save(mut self, message: &str) -> Self {
        self.git(&["add", "--all"]);
        self.git(&["commit", "--message", message]);
        self.commits += 1;
        self
    }

    /// Creates a branch at `HEAD` and switches to it.
    pub(crate) fn branch(self, name: &str) -> Self {
        self.git(&["switch", "--create", name]);
        self
    }

    pub(crate) fn switch(self, name: &str) -> Self {
        self.git(&["switch", name]);
        self
    }

    /// Merges `name` into the current branch with a merge commit. A conflict is permitted.
    pub(crate) fn merge(mut self, name: &str) -> Self {
        self.try_git(&[
            "merge",
            "--no-ff",
            "--message",
            &format!("merge {name}"),
            name,
        ]);
        self.commits += 1;
        self
    }

    /// Runs `git` in the repository and returns its standard output.
    ///
    /// # Panics
    ///
    /// Panics if `git` fails.
    pub(crate) fn git(&self, args: &[&str]) -> String {
        let (success, output) = self.try_git(args);
        assert!(success, "git {args:?} failed: {output}");
        output
    }

    /// The time of the newest commit.
    pub(crate) fn last_commit_time(&self) -> i64 {
        FIRST_COMMIT_TIME + (self.commits - 1) * COMMIT_INTERVAL
    }

    fn try_git(&self, args: &[&str]) -> (bool, String) {
        let date = format!(
            "@{} +0000",
            FIRST_COMMIT_TIME + self.commits * COMMIT_INTERVAL
        );
        let output = git_command()
            .args(args)
            .current_dir(self.path())
            // The configuration of the machine must not change the result.
            .env("GIT_CONFIG_GLOBAL", self.root.path().join("gitconfig"))
            .env("GIT_CONFIG_NOSYSTEM", "1")
            .env("GIT_AUTHOR_NAME", "Test Author")
            .env("GIT_AUTHOR_EMAIL", "author@example.com")
            .env("GIT_COMMITTER_NAME", "Test Author")
            .env("GIT_COMMITTER_EMAIL", "author@example.com")
            .env("GIT_AUTHOR_DATE", &date)
            .env("GIT_COMMITTER_DATE", &date)
            .output()
            .expect("failed to start git");
        let text = [output.stdout, output.stderr].concat();
        (
            output.status.success(),
            String::from_utf8_lossy(&text).trim().to_owned(),
        )
    }
}
