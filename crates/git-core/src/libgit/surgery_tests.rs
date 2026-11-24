//! Tests of merge, rebase, cherry-pick, revert, reset, and conflict resolution.

use crate::fixture::RepoFixture;
use crate::model::{
    ConflictBlock, ConflictChoice, ConflictSide, OperationKind, OperationResult, ResetMode,
    Resolution,
};
use crate::{GitBackend, GitError};

fn subjects(fixture: &RepoFixture) -> Vec<String> {
    let log = fixture.git(&["log", "--format=%s"]);
    log.lines().map(str::to_owned).collect()
}

fn head(fixture: &RepoFixture) -> String {
    fixture.git(&["rev-parse", "HEAD"])
}

fn stopped_kind(backend: &dyn GitBackend) -> Option<OperationKind> {
    backend.summary().unwrap().operation.map(|found| found.kind)
}

fn done(result: OperationResult) -> (String, String) {
    match result {
        OperationResult::Done { previous, head } => (previous, head),
        OperationResult::Stopped { conflicts } => panic!("stopped at {conflicts:?}"),
    }
}

fn blocks(choices: &[ConflictChoice]) -> Resolution {
    Resolution::Blocks {
        choices: choices.to_vec(),
    }
}

/// `main` has "c", and `feature` has "b". The two do not touch the same file.
fn two_branches() -> RepoFixture {
    RepoFixture::new()
        .commit("a")
        .branch("feature")
        .commit("b")
        .switch("main")
        .commit("c")
}

#[test]
fn merges_a_branch_and_the_undo_removes_the_merge() {
    let fixture = two_branches();
    let backend = fixture.backend();

    let (previous, now) = done(backend.merge("feature").unwrap());

    assert_eq!(now, head(&fixture));
    assert_eq!(
        fixture
            .git(&["rev-list", "--parents", "-1", "HEAD"])
            .split(' ')
            .count(),
        3
    );
    backend.restore_head(&previous).unwrap();
    assert_eq!(head(&fixture), previous);
}

#[test]
fn stops_a_merge_at_conflicts_and_continues_after_the_resolution() {
    let fixture = RepoFixture::diverged();
    let backend = fixture.backend();

    let result = backend.merge("feature").unwrap();
    assert_eq!(
        result,
        OperationResult::Stopped {
            conflicts: vec!["file.txt".into()]
        }
    );
    assert_eq!(stopped_kind(backend.as_ref()), Some(OperationKind::Merge));
    let early = backend.continue_operation().unwrap_err();
    assert!(matches!(early, GitError::Rejected(_)), "error: {early:?}");

    let both = blocks(&[ConflictChoice::Both]);
    backend.resolve_conflict("file.txt", &both).unwrap();
    done(backend.continue_operation().unwrap());

    assert_eq!(fixture.git(&["show", "HEAD:file.txt"]), "main\nfeature");
    assert_eq!(stopped_kind(backend.as_ref()), None);
}

#[test]
fn aborts_a_merge_and_puts_back_the_state_from_before() {
    let fixture = RepoFixture::diverged();
    let before = head(&fixture);
    let backend = fixture.backend();
    backend.merge("feature").unwrap();

    backend.abort_operation().unwrap();

    assert_eq!(stopped_kind(backend.as_ref()), None);
    assert_eq!(head(&fixture), before);
    assert!(fixture.git(&["status", "--porcelain"]).is_empty());
}

#[test]
fn rejects_a_new_operation_while_another_one_has_stopped() {
    let fixture = RepoFixture::diverged();
    let backend = fixture.backend();
    backend.merge("feature").unwrap();

    let error = backend.rebase("feature").unwrap_err();

    assert!(matches!(error, GitError::Rejected(_)), "error: {error:?}");
}

#[test]
fn rebases_a_branch_through_a_conflict_and_the_undo_puts_it_back() {
    let fixture = RepoFixture::diverged().switch("feature");
    let old_tip = head(&fixture);
    let backend = fixture.backend();

    let result = backend.rebase("main").unwrap();
    assert!(matches!(result, OperationResult::Stopped { .. }));
    let theirs = blocks(&[ConflictChoice::Theirs]);
    backend.resolve_conflict("file.txt", &theirs).unwrap();
    let (previous, _) = done(backend.continue_operation().unwrap());

    assert_eq!(previous, old_tip);
    assert_eq!(
        subjects(&fixture),
        ["feature extra", "feature change", "main change", "a"]
    );
    backend.restore_head(&previous).unwrap();
    assert_eq!(head(&fixture), old_tip);
}

#[test]
fn skips_the_commit_of_a_rebase_that_stopped() {
    let fixture = RepoFixture::diverged().switch("feature");
    let backend = fixture.backend();
    backend.rebase("main").unwrap();

    done(backend.skip_operation().unwrap());

    assert_eq!(subjects(&fixture), ["feature extra", "main change", "a"]);
}

#[test]
fn cherry_picks_a_commit_and_rejects_a_commit_of_the_current_branch() {
    let fixture = two_branches();
    let backend = fixture.backend();
    let picked = fixture.git(&["rev-parse", "feature"]);
    let ancestor = fixture.git(&["rev-parse", "HEAD~1"]);

    done(backend.cherry_pick(&picked).unwrap());

    assert_eq!(subjects(&fixture), ["b", "c", "a"]);
    let error = backend.cherry_pick(&ancestor).unwrap_err();
    assert!(matches!(error, GitError::Rejected(_)), "error: {error:?}");
}

#[test]
fn reverts_a_commit() {
    let fixture = RepoFixture::new().commit("a").commit("b");

    done(fixture.backend().revert(&head(&fixture)).unwrap());

    assert_eq!(subjects(&fixture)[0], "Revert \"b\"");
    assert!(!fixture.path().join("b.txt").exists());
}

#[test]
fn resets_softly_and_the_undo_puts_the_branch_back() {
    let fixture = RepoFixture::new().commit("a").commit("b").commit("c");
    let before = head(&fixture);
    let target = fixture.git(&["rev-parse", "HEAD~2"]);
    let backend = fixture.backend();

    let receipt = backend.reset(&target, ResetMode::Soft).unwrap();

    assert_eq!(head(&fixture), target);
    assert_eq!(
        fixture.git(&["diff", "--cached", "--name-only"]),
        "b.txt\nc.txt"
    );
    backend.undo_reset(&receipt).unwrap();
    assert_eq!(head(&fixture), before);
    assert!(fixture.git(&["status", "--porcelain"]).is_empty());
}

#[test]
fn resets_hard_with_a_backup_of_the_uncommitted_changes() {
    let fixture = RepoFixture::new()
        .commit("a")
        .commit("b")
        .write("a.txt", "staged\n")
        .stage("a.txt")
        .write("a.txt", "staged\nlater\n");
    let snapshot = |fixture: &RepoFixture| {
        let staged = fixture.git(&["diff", "--cached"]);
        format!("{}\n{staged}\n{}", head(fixture), fixture.git(&["diff"]))
    };
    let before = snapshot(&fixture);
    let target = fixture.git(&["rev-parse", "HEAD~1"]);
    let backend = fixture.backend();

    let receipt = backend.reset(&target, ResetMode::Hard).unwrap();

    assert!(fixture.git(&["status", "--porcelain"]).is_empty());
    assert_eq!(
        backend.stashes().unwrap()[0].hash,
        receipt.backup.clone().unwrap()
    );
    backend.undo_reset(&receipt).unwrap();
    assert_eq!(snapshot(&fixture), before);
    assert!(backend.stashes().unwrap().is_empty());
}

#[test]
fn reads_the_conflicts_of_a_file_with_the_labels() {
    let fixture = RepoFixture::new()
        .write("file.txt", "1\n2\n3\n4\nbase\n")
        .commit("a")
        .branch("feature")
        .write("file.txt", "1\n2\n3\n4\nfeature\n")
        .save("feature change")
        .switch("main")
        .write("file.txt", "1\n2\n3\n4\nmain\nmore\n")
        .save("main change");
    let backend = fixture.backend();
    backend.merge("feature").unwrap();

    let file = backend.conflict_file("file.txt").unwrap();

    assert!(file.text && !file.ours_deleted && !file.theirs_deleted);
    let [
        ConflictBlock::Clean { lines },
        ConflictBlock::Conflict {
            line, ours, theirs, ..
        },
    ] = file.blocks.as_slice()
    else {
        panic!("unexpected blocks: {:?}", file.blocks);
    };
    assert_eq!(lines, &["1", "2", "3", "4"]);
    assert_eq!(*line, 5);
    assert_eq!(
        (ours.join(" "), theirs.join(" ")),
        ("main more".into(), "feature".into())
    );
    let ConflictBlock::Conflict {
        ours_label,
        theirs_label,
        ..
    } = &file.blocks[1]
    else {
        unreachable!();
    };
    assert_eq!(
        (ours_label.as_str(), theirs_label.as_str()),
        ("HEAD", "feature")
    );
}

#[test]
fn keeps_one_side_and_the_undo_puts_the_conflict_back() {
    let fixture = RepoFixture::diverged();
    let backend = fixture.backend();
    backend.merge("feature").unwrap();

    let theirs = Resolution::File {
        side: ConflictSide::Theirs,
    };
    backend.resolve_conflict("file.txt", &theirs).unwrap();
    assert_eq!(fixture.git(&["show", ":file.txt"]), "feature");
    assert!(backend.status().unwrap().unstaged.is_empty());

    backend.restore_conflict("file.txt").unwrap();
    let file = backend.conflict_file("file.txt").unwrap();
    assert!(matches!(file.blocks[0], ConflictBlock::Conflict { .. }));
}

#[test]
fn keeps_the_deletion_of_a_side_that_deleted_the_file() {
    let fixture = RepoFixture::new()
        .write("file.txt", "base\n")
        .commit("a")
        .branch("feature")
        .write("file.txt", "changed\n")
        .save("change")
        .switch("main")
        .remove("file.txt")
        .save("delete");
    let backend = fixture.backend();
    backend.merge("feature").unwrap();
    assert!(backend.conflict_file("file.txt").unwrap().ours_deleted);

    let ours = Resolution::File {
        side: ConflictSide::Ours,
    };
    backend.resolve_conflict("file.txt", &ours).unwrap();

    assert!(!fixture.path().join("file.txt").exists());
    done(backend.continue_operation().unwrap());
}

#[test]
fn rejects_a_resolution_of_a_file_without_conflicts() {
    let fixture = RepoFixture::new().commit("a");

    let error = fixture
        .backend()
        .resolve_conflict("a.txt", &blocks(&[]))
        .unwrap_err();

    assert!(matches!(error, GitError::Rejected(_)), "error: {error:?}");
}
