use git2::Repository;

use super::log::history_walk;
use crate::GitError;

const SECONDS_PER_DAY: i64 = 86_400;

/// Counts the commits on each of the `days` days before `now`. The oldest day is first.
pub(super) fn read(repo: &Repository, days: u32, now: i64) -> Result<Vec<u32>, GitError> {
    let mut counts = vec![0; days as usize];
    let oldest = now - i64::from(days) * SECONDS_PER_DAY;

    for oid in history_walk(repo)? {
        let time = repo.find_commit(oid?)?.time().seconds();
        // The walk gives the newest commit first.
        if time < oldest {
            break;
        }
        if let Some(slot) = slot_of(&mut counts, now - time) {
            *slot += 1;
        }
    }
    Ok(counts)
}

/// Finds the counter for a commit that is `age` seconds old.
fn slot_of(counts: &mut [u32], age: i64) -> Option<&mut u32> {
    let days_ago = usize::try_from(age.max(0) / SECONDS_PER_DAY).ok()?;
    let index = counts.len().checked_sub(days_ago + 1)?;
    counts.get_mut(index)
}

#[cfg(test)]
mod tests {
    use super::{SECONDS_PER_DAY, read};
    use crate::fixture::RepoFixture;

    #[test]
    fn counts_the_commits_of_each_day_with_the_oldest_day_first() {
        let fixture = RepoFixture::new().commit("a").commit("b");
        let repo = fixture.repository();
        let soon = fixture.last_commit_time() + 10;

        assert_eq!(read(&repo, 3, soon).unwrap(), [0, 0, 2]);
        assert_eq!(read(&repo, 3, soon + SECONDS_PER_DAY).unwrap(), [0, 2, 0]);
    }

    #[test]
    fn leaves_out_the_commits_that_are_too_old() {
        let fixture = RepoFixture::new().commit("a");
        let later = fixture.last_commit_time() + 5 * SECONDS_PER_DAY;

        assert_eq!(read(&fixture.repository(), 3, later).unwrap(), [0, 0, 0]);
    }

    #[test]
    fn gives_zeros_for_a_repository_without_commits() {
        let fixture = RepoFixture::new();

        assert_eq!(read(&fixture.repository(), 2, 0).unwrap(), [0, 0]);
    }
}
