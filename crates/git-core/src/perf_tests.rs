//! Measures the read operations on a large repository.
//!
//! The test is slow, so it runs only on request: `pnpm bench`.

use std::fmt::Write as _;
use std::fs;
use std::io::Write as _;
use std::process::Stdio;
use std::time::{Duration, Instant};

use crate::cli::git_command;
use crate::fixture::RepoFixture;
use crate::model::DiffTarget;

const COMMITS: usize = 50_000;
const FILES: usize = 5_000;
const BRANCHES: usize = 200;
/// The changes in the working tree: modified files and new files.
const MODIFIED: usize = 1_000;
const UNTRACKED: usize = 2_000;
/// Each read operation must take less time than this on the large repository.
const BUDGET: Duration = Duration::from_millis(500);

#[test]
#[ignore = "slow: builds a repository with 50 000 commits"]
fn large_repository_reads_stay_in_budget() {
    let fixture = large_repository();
    let backend = fixture.backend();
    let head = backend.summary().unwrap().head.hash.unwrap();
    let root = fixture.git(&["rev-list", "--max-parents=0", "HEAD"]);
    let changed = DiffTarget::Unstaged { path: file_path(0) };

    let results = [
        measure("summary", || backend.summary().map(drop)),
        measure("status", || backend.status().map(drop)),
        measure("log, first page", || backend.log(0, 200).map(drop)),
        measure("log, page at 10 000", || backend.log(10_000, 200).map(drop)),
        measure("branches", || backend.branches().map(drop)),
        measure("commit detail", || backend.commit_detail(&head).map(drop)),
        measure("commit of 5 000 files", || {
            backend.commit_detail(&root).map(drop)
        }),
        measure("file diff", || backend.file_diff(&changed).map(drop)),
        measure("activity, 30 days", || backend.activity(30).map(drop)),
        measure("stashes", || backend.stashes().map(drop)),
        measure("remotes", || backend.remotes().map(drop)),
    ];

    println!("{}", report(&results));
    let slow: Vec<_> = results.iter().filter(|(_, time)| *time > BUDGET).collect();
    assert!(slow.is_empty(), "over the budget: {slow:?}");
}

/// Runs `read` three times and returns the shortest time. The first run fills the caches.
fn measure<T>(name: &'static str, read: impl Fn() -> Result<(), T>) -> (&'static str, Duration)
where
    T: std::fmt::Debug,
{
    let mut best = Duration::MAX;
    for _ in 0..3 {
        let start = Instant::now();
        read().unwrap();
        best = best.min(start.elapsed());
    }
    (name, best)
}

fn report(results: &[(&str, Duration)]) -> String {
    let mut text = String::from("\nRead operation          Time\n");
    for (name, time) in results {
        writeln!(text, "{name:<22}  {:>6.1} ms", time.as_secs_f64() * 1000.0).unwrap();
    }
    text
}

/// Builds the history with `git fast-import`, then changes the working tree.
fn large_repository() -> RepoFixture {
    let fixture = RepoFixture::new();
    let mut import = git_command()
        .args(["fast-import", "--quiet"])
        .current_dir(fixture.path())
        .stdin(Stdio::piped())
        .spawn()
        .unwrap();
    import
        .stdin
        .take()
        .unwrap()
        .write_all(history().as_bytes())
        .unwrap();
    assert!(import.wait().unwrap().success(), "git fast-import failed");
    fixture.git(&["reset", "--quiet", "--hard", "main"]);
    change_working_tree(&fixture);
    fixture
}

/// The stream of `git fast-import`: each commit changes one file. Some commits get a branch.
fn history() -> String {
    let mut stream = String::new();
    for index in 0..COMMITS {
        let mark = index + 1;
        let time = 1_600_000_000 + index * 600;
        let message = format!("change {index}");
        write!(
            stream,
            "commit refs/heads/main\nmark :{mark}\n\
             committer Test Author <author@example.com> {time} +0000\n\
             data {}\n{message}\n",
            message.len()
        )
        .unwrap();
        if index == 0 {
            (0..FILES).for_each(|file| stream.push_str(&file_change(file, 0)));
        } else {
            writeln!(stream, "from :{index}").unwrap();
            stream.push_str(&file_change(index % FILES, index));
        }
    }
    for branch in 0..BRANCHES {
        let mark = branch * (COMMITS / BRANCHES) + 1;
        writeln!(stream, "reset refs/heads/topic/{branch}\nfrom :{mark}\n").unwrap();
    }
    stream
}

/// A file of 40 lines. `version` changes its last line.
fn file_change(file: usize, version: usize) -> String {
    let content = file_content(file, version);
    format!(
        "M 100644 inline {}\ndata {}\n{content}\n",
        file_path(file),
        content.len()
    )
}

/// 100 files in each folder. A change then writes small trees.
fn file_path(file: usize) -> String {
    format!("src/d{}/f{file}.txt", file / 100)
}

fn file_content(file: usize, version: usize) -> String {
    let mut content: String = (0..39)
        .map(|line| format!("file {file}, line {line}\n"))
        .collect();
    writeln!(content, "version {version}").unwrap();
    content
}

fn change_working_tree(fixture: &RepoFixture) {
    let root = fixture.path();
    for file in 0..MODIFIED {
        let path = root.join(file_path(file));
        fs::write(path, file_content(file, COMMITS + 1)).unwrap();
    }
    fs::create_dir(root.join("new")).unwrap();
    for file in 0..UNTRACKED {
        let path = root.join(format!("new/n{file}.txt"));
        fs::write(path, file_content(file, 0)).unwrap();
    }
}
