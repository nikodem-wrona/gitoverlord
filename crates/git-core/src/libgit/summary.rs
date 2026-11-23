use std::path::{Path, PathBuf};

use git2::{ErrorCode, Repository};

use super::lossy;
use crate::GitError;
use crate::model::{Head, RepoSummary};

const BRANCH_PREFIX: &str = "refs/heads/";

pub(super) fn read(repo: &Repository) -> Result<RepoSummary, GitError> {
    let workdir = workdir(repo)?;
    let mut tags = names(&repo.tag_names(None)?);
    tags.reverse();

    Ok(RepoSummary {
        name: folder_name(&workdir),
        path: workdir.to_string_lossy().into_owned(),
        head: read_head(repo)?,
        remotes: names(&repo.remotes()?),
        tags,
    })
}

/// Returns the working tree path without the separator at its end.
pub(crate) fn workdir(repo: &Repository) -> Result<PathBuf, GitError> {
    let path = repo
        .workdir()
        .ok_or_else(|| GitError::NotARepository(repo.path().display().to_string()))?;
    Ok(path.components().collect())
}

fn folder_name(path: &Path) -> String {
    let name = path.file_name().unwrap_or(path.as_os_str());
    name.to_string_lossy().into_owned()
}

fn names(array: &git2::string_array::StringArray) -> Vec<String> {
    array.iter_bytes().map(lossy).collect()
}

fn read_head(repo: &Repository) -> Result<Head, GitError> {
    match repo.head() {
        Ok(head) => Ok(Head {
            branch: head.is_branch().then(|| lossy(head.shorthand_bytes())),
            hash: head.target().map(|oid| oid.to_string()),
        }),
        // A new repository has a branch name but no commit.
        Err(error) if error.code() == ErrorCode::UnbornBranch => Ok(Head {
            branch: unborn_branch(repo),
            hash: None,
        }),
        Err(error) => Err(error.into()),
    }
}

fn unborn_branch(repo: &Repository) -> Option<String> {
    let head = repo.find_reference("HEAD").ok()?;
    let target = lossy(head.symbolic_target_bytes()?);
    Some(target.strip_prefix(BRANCH_PREFIX)?.to_owned())
}

#[cfg(test)]
mod tests {
    use crate::fixture::RepoFixture;
    use crate::{GitError, open_repo};

    #[test]
    fn reads_the_name_the_path_and_the_head() {
        let fixture = RepoFixture::new().commit("a");

        let summary = fixture.backend().summary().unwrap();

        assert_eq!(summary.name, "repo");
        assert!(summary.path.ends_with("repo"), "path: {}", summary.path);
        assert_eq!(summary.head.branch.as_deref(), Some("main"));
        assert_eq!(summary.head.hash, Some(fixture.git(&["rev-parse", "HEAD"])));
    }

    #[test]
    fn reads_a_repository_without_commits() {
        let summary = RepoFixture::new().backend().summary().unwrap();

        assert_eq!(summary.head.branch.as_deref(), Some("main"));
        assert_eq!(summary.head.hash, None);
    }

    #[test]
    fn reads_a_detached_head_without_a_branch() {
        let fixture = RepoFixture::new().commit("a").commit("b");
        fixture.git(&["switch", "--detach", "HEAD~1"]);

        let summary = fixture.backend().summary().unwrap();

        assert_eq!(summary.head.branch, None);
        assert_eq!(summary.head.hash, Some(fixture.git(&["rev-parse", "HEAD"])));
    }

    #[test]
    fn lists_the_remotes_and_the_tags_with_the_newest_tag_first() {
        let fixture = RepoFixture::new().commit("a");
        fixture.git(&["remote", "add", "origin", "https://example.com/repo.git"]);
        fixture.git(&["tag", "v0.1.0"]);
        fixture.git(&["tag", "v0.2.0"]);

        let summary = fixture.backend().summary().unwrap();

        assert_eq!(summary.remotes, ["origin"]);
        assert_eq!(summary.tags, ["v0.2.0", "v0.1.0"]);
    }

    #[test]
    fn opens_the_repository_from_a_folder_inside_it() {
        let fixture = RepoFixture::new().write("src/a.txt", "a\n");

        let summary = open_repo(&fixture.path().join("src")).unwrap().summary();

        assert_eq!(summary.unwrap().name, "repo");
    }

    #[test]
    fn rejects_a_folder_that_is_not_a_repository() {
        let folder = tempfile::tempdir().unwrap();

        let error = open_repo(folder.path()).err();

        assert!(matches!(error, Some(GitError::NotARepository(_))));
    }
}
