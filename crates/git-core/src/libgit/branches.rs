use std::cmp::Reverse;

use git2::{BranchType, Repository};

use super::{count, lossy};
use crate::GitError;
use crate::model::Branch;

pub(super) fn read(repo: &Repository) -> Result<Vec<Branch>, GitError> {
    let mut branches = Vec::new();
    for entry in repo.branches(Some(BranchType::Local))? {
        let (branch, _) = entry?;
        if let Some(branch) = to_branch(repo, &branch)? {
            branches.push(branch);
        }
    }
    // The current branch is first. Then the newest branch is first.
    branches.sort_by_key(|branch| Reverse((branch.current, branch.updated)));
    Ok(branches)
}

/// Returns `None` for a branch without a readable name or without a commit.
fn to_branch(repo: &Repository, branch: &git2::Branch<'_>) -> Result<Option<Branch>, GitError> {
    let (Ok(name), Some(tip)) = (branch.name_bytes(), branch.get().target()) else {
        return Ok(None);
    };
    let upstream = branch.upstream().ok();
    let upstream_tip = upstream.as_ref().and_then(|found| found.get().target());
    let (ahead, behind) = match upstream_tip {
        Some(target) => repo.graph_ahead_behind(tip, target)?,
        None => (0, 0),
    };

    Ok(Some(Branch {
        name: lossy(name),
        current: branch.is_head(),
        upstream: upstream.and_then(|found| found.name_bytes().ok().map(lossy)),
        ahead: count(ahead),
        behind: count(behind),
        tip: tip.to_string(),
        updated: repo.find_commit(tip)?.time().seconds(),
    }))
}

#[cfg(test)]
mod tests {
    use crate::fixture::RepoFixture;

    #[test]
    fn lists_the_current_branch_first() {
        let fixture = RepoFixture::new()
            .commit("a")
            .branch("feature")
            .commit("b")
            .switch("main");

        let branches = fixture.backend().branches().unwrap();

        let names: Vec<_> = branches.iter().map(|branch| branch.name.as_str()).collect();
        assert_eq!(names, ["main", "feature"]);
        assert!(branches[0].current);
        assert!(!branches[1].current);
        assert_eq!(branches[1].tip, fixture.git(&["rev-parse", "feature"]));
        assert_eq!(branches[1].updated, fixture.last_commit_time());
    }

    #[test]
    fn counts_the_commits_ahead_of_and_behind_the_upstream() {
        let fixture = RepoFixture::new().commit("a").commit("b").commit("c");
        fixture.git(&["remote", "add", "origin", "https://example.com/repo.git"]);
        // The upstream has commit "b". The local branch drops "c" and adds "d".
        fixture.git(&["update-ref", "refs/remotes/origin/main", "HEAD~1"]);
        fixture.git(&["branch", "--set-upstream-to=origin/main"]);
        fixture.git(&["reset", "--hard", "HEAD~2"]);
        let fixture = fixture.commit("d").commit("e");

        let branches = fixture.backend().branches().unwrap();

        assert_eq!(branches[0].upstream.as_deref(), Some("origin/main"));
        assert_eq!((branches[0].ahead, branches[0].behind), (2, 1));
    }

    #[test]
    fn reports_no_upstream_for_a_local_branch() {
        let branches = RepoFixture::new().commit("a").backend().branches().unwrap();

        assert_eq!(branches[0].upstream, None);
        assert_eq!((branches[0].ahead, branches[0].behind), (0, 0));
    }

    #[test]
    fn gives_no_branches_for_a_repository_without_commits() {
        assert!(RepoFixture::new().backend().branches().unwrap().is_empty());
    }
}
