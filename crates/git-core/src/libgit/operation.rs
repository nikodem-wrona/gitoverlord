//! Reads the merge, rebase, cherry-pick, or revert that stopped.

use std::fs;
use std::path::{Path, PathBuf};

use git2::{Repository, RepositoryState};

use crate::GitError;
use crate::model::{Operation, OperationKind};

/// Returns the operation that stopped, or `None`.
pub(super) fn read(repo: &Repository) -> Result<Option<Operation>, GitError> {
    let Some(kind) = kind(repo.state()) else {
        return Ok(None);
    };
    let rebase = (kind == OperationKind::Rebase)
        .then(|| rebase_folder(repo))
        .flatten();
    let steps = rebase.as_ref().map(RebaseFolder::steps);
    Ok(Some(Operation {
        kind,
        commit: reference(repo, head_file(kind)),
        branch: rebase.as_ref().and_then(RebaseFolder::branch),
        step: steps.and_then(|(step, _)| step),
        steps: steps.and_then(|(_, total)| total),
    }))
}

/// Returns the commit of `HEAD`. Rejects a repository without commits.
pub(super) fn head(repo: &Repository) -> Result<String, GitError> {
    reference(repo, "HEAD")
        .ok_or_else(|| GitError::Rejected("The repository has no commits.".to_owned()))
}

/// Reads a special reference such as `ORIG_HEAD`.
pub(super) fn reference(repo: &Repository, name: &str) -> Option<String> {
    repo.refname_to_id(name).ok().map(|id| id.to_string())
}

fn kind(state: RepositoryState) -> Option<OperationKind> {
    match state {
        RepositoryState::Merge => Some(OperationKind::Merge),
        RepositoryState::Revert | RepositoryState::RevertSequence => Some(OperationKind::Revert),
        RepositoryState::CherryPick | RepositoryState::CherryPickSequence => {
            Some(OperationKind::CherryPick)
        }
        RepositoryState::Rebase
        | RepositoryState::RebaseInteractive
        | RepositoryState::RebaseMerge
        | RepositoryState::ApplyMailboxOrRebase => Some(OperationKind::Rebase),
        RepositoryState::Clean | RepositoryState::Bisect | RepositoryState::ApplyMailbox => None,
    }
}

/// The reference to the commit that the operation applies now.
fn head_file(kind: OperationKind) -> &'static str {
    match kind {
        OperationKind::Merge => "MERGE_HEAD",
        OperationKind::Rebase => "REBASE_HEAD",
        OperationKind::CherryPick => "CHERRY_PICK_HEAD",
        OperationKind::Revert => "REVERT_HEAD",
    }
}

/// The folder where `git` keeps the state of a rebase, with the names of its step files.
struct RebaseFolder {
    path: PathBuf,
    step: &'static str,
    total: &'static str,
}

fn rebase_folder(repo: &Repository) -> Option<RebaseFolder> {
    let merge = RebaseFolder {
        path: repo.path().join("rebase-merge"),
        step: "msgnum",
        total: "end",
    };
    let apply = RebaseFolder {
        path: repo.path().join("rebase-apply"),
        step: "next",
        total: "last",
    };
    [merge, apply]
        .into_iter()
        .find(|folder| folder.path.is_dir())
}

impl RebaseFolder {
    fn steps(&self) -> (Option<u32>, Option<u32>) {
        let number = |name: &str| read_text(&self.path.join(name))?.parse().ok();
        (number(self.step), number(self.total))
    }

    fn branch(&self) -> Option<String> {
        let name = read_text(&self.path.join("head-name"))?;
        name.strip_prefix("refs/heads/").map(str::to_owned)
    }
}

fn read_text(path: &Path) -> Option<String> {
    Some(fs::read_to_string(path).ok()?.trim().to_owned())
}

#[cfg(test)]
mod tests {
    use crate::fixture::RepoFixture;
    use crate::model::OperationKind;

    #[test]
    fn reports_no_operation_in_a_clean_repository() {
        let summary = RepoFixture::new().commit("a").backend().summary().unwrap();

        assert_eq!(summary.operation, None);
    }

    #[test]
    fn reports_a_merge_with_the_incoming_commit() {
        let fixture = RepoFixture::diverged().merge("feature");

        let operation = fixture.backend().summary().unwrap().operation.unwrap();

        assert_eq!(operation.kind, OperationKind::Merge);
        assert_eq!(
            operation.commit,
            Some(fixture.git(&["rev-parse", "feature"]))
        );
        assert_eq!(operation.step, None);
    }

    #[test]
    fn reports_the_branch_and_the_step_of_a_rebase() {
        let fixture = RepoFixture::diverged().switch("feature");
        fixture.try_git(&["rebase", "main"]);

        let operation = fixture.backend().summary().unwrap().operation.unwrap();

        assert_eq!(operation.kind, OperationKind::Rebase);
        assert_eq!(operation.branch.as_deref(), Some("feature"));
        assert_eq!((operation.step, operation.steps), (Some(1), Some(2)));
        assert_eq!(
            operation.commit,
            Some(fixture.git(&["rev-parse", "feature~1"]))
        );
    }
}
