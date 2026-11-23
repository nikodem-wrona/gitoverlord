use git2::{Diff, Repository};

use super::refs::RefIndex;
use super::{delta, log, lossy};
use crate::GitError;
use crate::model::CommitDetail;

pub(super) fn read(repo: &Repository, hash: &str) -> Result<CommitDetail, GitError> {
    let commit = find_commit(repo, hash)?;
    let diff = commit_diff(repo, &commit)?;

    Ok(CommitDetail {
        commit: log::to_commit(&commit, &RefIndex::read(repo)?),
        body: commit.body_bytes().map(lossy).unwrap_or_default(),
        email: lossy(commit.author().email_bytes()),
        files: delta::list(&diff)?,
    })
}

pub(super) fn find_commit<'repo>(
    repo: &'repo Repository,
    hash: &str,
) -> Result<git2::Commit<'repo>, GitError> {
    Ok(repo.revparse_single(hash)?.peel_to_commit()?)
}

/// Compares a commit with its first parent. The first commit is compared with an empty tree.
pub(super) fn commit_diff<'repo>(
    repo: &'repo Repository,
    commit: &git2::Commit<'_>,
) -> Result<Diff<'repo>, GitError> {
    let parent = match commit.parent(0) {
        Ok(parent) => Some(parent.tree()?),
        Err(_) => None,
    };
    let mut diff = repo.diff_tree_to_tree(parent.as_ref(), Some(&commit.tree()?), None)?;
    diff.find_similar(None)?;
    Ok(diff)
}

#[cfg(test)]
mod tests {
    use crate::GitError;
    use crate::fixture::RepoFixture;
    use crate::model::ChangeKind;

    #[test]
    fn reads_the_message_the_author_and_the_changed_files() {
        let fixture = RepoFixture::new()
            .write("keep.txt", "one\ntwo\n")
            .commit("a")
            .write("keep.txt", "one\nthree\nfour\n")
            .write("new.txt", "new\n")
            .save("change the files\n\nThe body has\ntwo lines.");

        let detail = fixture.backend().commit_detail("HEAD").unwrap();

        assert_eq!(detail.commit.subject, "change the files");
        assert_eq!(detail.body, "The body has\ntwo lines.");
        assert_eq!(detail.email, "author@example.com");
        let files: Vec<_> = detail
            .files
            .iter()
            .map(|file| {
                (
                    file.path.as_str(),
                    file.kind,
                    file.additions,
                    file.deletions,
                )
            })
            .collect();
        assert_eq!(
            files,
            [
                ("keep.txt", ChangeKind::Modified, 2, 1),
                ("new.txt", ChangeKind::Added, 1, 0),
            ]
        );
    }

    #[test]
    fn compares_the_first_commit_with_an_empty_tree() {
        let fixture = RepoFixture::new().commit("a");

        let detail = fixture.backend().commit_detail("HEAD").unwrap();

        assert_eq!(detail.files.len(), 1);
        assert_eq!(detail.files[0].kind, ChangeKind::Added);
    }

    #[test]
    fn reports_a_renamed_file_with_its_old_path() {
        let fixture = RepoFixture::new()
            .write("old.txt", "one\ntwo\nthree\n")
            .commit("a");
        fixture.git(&["mv", "old.txt", "new.txt"]);
        let fixture = fixture.save("rename");

        let detail = fixture.backend().commit_detail("HEAD").unwrap();

        assert_eq!(detail.files[0].kind, ChangeKind::Renamed);
        assert_eq!(detail.files[0].old_path.as_deref(), Some("old.txt"));
    }

    #[test]
    fn fails_for_a_commit_that_does_not_exist() {
        let fixture = RepoFixture::new().commit("a");

        let error = fixture.backend().commit_detail("0123456789abcdef").err();

        assert!(matches!(error, Some(GitError::ReadFailed(_))));
    }
}
