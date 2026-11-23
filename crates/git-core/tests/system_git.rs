//! Tests that use the `git` executable of the machine.

use git_core::GitVersion;

#[test]
fn detects_the_system_git() {
    let version = GitVersion::detect().expect("install git to run this test");

    assert!(version.major >= 2, "unexpected git version: {version:?}");
}
