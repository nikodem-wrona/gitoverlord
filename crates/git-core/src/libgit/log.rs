use git2::{BranchType, Oid, Repository, Revwalk, Sort};

use super::lossy;
use super::refs::RefIndex;
use crate::GitError;
use crate::model::{Commit, LogPage};

pub(super) fn read(repo: &Repository, skip: u32, limit: u32) -> Result<LogPage, GitError> {
    let refs = RefIndex::read(repo)?;
    let walk = history_walk(repo)?;
    let size = limit as usize;

    // One more commit than the limit shows that there is a next page.
    let mut commits = Vec::with_capacity(size);
    for oid in walk.skip(skip as usize).take(size + 1) {
        commits.push(to_commit(&repo.find_commit(oid?)?, &refs));
    }
    let has_next = commits.len() > size;
    commits.truncate(size);

    Ok(LogPage {
        commits,
        next: has_next.then(|| skip.saturating_add(limit)),
    })
}

/// Starts a walk from `HEAD` and from each local branch. The newest commit is first.
///
/// The walk is empty when the repository has no commits.
pub(super) fn history_walk(repo: &Repository) -> Result<Revwalk<'_>, GitError> {
    let mut walk = repo.revwalk()?;
    // This is the order of `git log`. libgit2 reads the commits only when the walk
    // reaches them. Each other sort mode reads the full history before the first commit.
    walk.set_sorting(Sort::NONE)?;
    // The walk starts with the commit of the last push, then sorts the parents by
    // time. Thus the newest start commit must be the last push.
    for (_, tip) in tips_by_time(repo)? {
        walk.push(tip)?;
    }
    Ok(walk)
}

/// Finds the commit of `HEAD` and of each local branch. The oldest commit is first.
fn tips_by_time(repo: &Repository) -> Result<Vec<(i64, Oid)>, GitError> {
    // A detached `HEAD` is not on a branch.
    let head = repo.head().ok().and_then(|head| head.target());
    let branches = repo.branches(Some(BranchType::Local))?;
    let branch_tips = branches.filter_map(|entry| entry.ok()?.0.get().target());

    let mut tips = Vec::new();
    for tip in head.into_iter().chain(branch_tips) {
        tips.push((repo.find_commit(tip)?.time().seconds(), tip));
    }
    tips.sort_unstable();
    tips.dedup();
    Ok(tips)
}

pub(super) fn to_commit(commit: &git2::Commit<'_>, refs: &RefIndex) -> Commit {
    Commit {
        hash: commit.id().to_string(),
        subject: commit.summary_bytes().map(lossy).unwrap_or_default(),
        author: lossy(commit.author().name_bytes()),
        time: commit.time().seconds(),
        parents: commit.parent_ids().map(|id| id.to_string()).collect(),
        refs: refs.names(commit.id()),
    }
}

#[cfg(test)]
mod tests {
    use crate::fixture::{FIRST_COMMIT_TIME, RepoFixture};

    fn subjects(fixture: &RepoFixture, skip: u32, limit: u32) -> Vec<String> {
        let page = fixture.backend().log(skip, limit).unwrap();
        page.commits
            .into_iter()
            .map(|commit| commit.subject)
            .collect()
    }

    #[test]
    fn lists_the_newest_commit_first_with_its_fields() {
        let fixture = RepoFixture::new().commit("a").commit("b");

        let page = fixture.backend().log(0, 10).unwrap();

        let [newest, oldest] = page.commits.as_slice() else {
            panic!("expected two commits, got {:?}", page.commits);
        };
        assert_eq!(newest.subject, "b");
        assert_eq!(newest.author, "Test Author");
        assert_eq!(newest.time, FIRST_COMMIT_TIME + 60);
        assert_eq!(newest.parents, std::slice::from_ref(&oldest.hash));
        assert_eq!(newest.refs, ["main"]);
        assert!(oldest.parents.is_empty());
        assert_eq!(page.next, None);
    }

    #[test]
    fn gives_the_history_in_pages() {
        let fixture = RepoFixture::new().commit("a").commit("b").commit("c");

        let first = fixture.backend().log(0, 2).unwrap();

        assert_eq!(first.next, Some(2));
        assert_eq!(subjects(&fixture, 0, 2), ["c", "b"]);
        assert_eq!(subjects(&fixture, 2, 2), ["a"]);
        assert_eq!(fixture.backend().log(2, 2).unwrap().next, None);
    }

    #[test]
    fn includes_the_commits_of_each_local_branch() {
        let fixture = RepoFixture::new()
            .commit("a")
            .branch("feature")
            .commit("b")
            .switch("main");

        assert_eq!(subjects(&fixture, 0, 10), ["b", "a"]);
    }

    #[test]
    fn sorts_the_commits_of_two_branches_by_time() {
        // The commits alternate between the two branches: "b" and "d" are on `feature`.
        let fixture = RepoFixture::new()
            .commit("a")
            .branch("feature")
            .commit("b")
            .switch("main")
            .commit("c")
            .switch("feature")
            .commit("d")
            .switch("main")
            .commit("e");

        assert_eq!(subjects(&fixture, 0, 10), ["e", "d", "c", "b", "a"]);
        assert_eq!(
            subjects(&fixture.switch("feature"), 0, 10),
            ["e", "d", "c", "b", "a"]
        );
    }

    #[test]
    fn includes_the_commits_of_a_detached_head() {
        let fixture = RepoFixture::new().commit("a").commit("b");
        fixture.git(&["switch", "--detach"]);
        let fixture = fixture.commit("c");

        assert_eq!(subjects(&fixture, 0, 10), ["c", "b", "a"]);
    }

    #[test]
    fn labels_a_commit_with_its_branches_and_tags() {
        let fixture = RepoFixture::new().commit("a").branch("feature");
        fixture.git(&["tag", "v1"]);

        let page = fixture.backend().log(0, 10).unwrap();

        assert_eq!(page.commits[0].refs, ["feature", "main", "tag: v1"]);
    }

    #[test]
    fn gives_an_empty_page_for_a_repository_without_commits() {
        let page = RepoFixture::new().backend().log(0, 10).unwrap();

        assert!(page.commits.is_empty());
        assert_eq!(page.next, None);
    }
}
