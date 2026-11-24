//! Reads the progress output of the network commands of `git`.

use std::io::{self, BufReader, Read};

use crate::model::Progress;

/// Reads the error output of `git`. Each progress line goes to `progress`.
/// The other lines return, for the error message.
pub(crate) fn read_output(
    output: impl Read,
    progress: &mut dyn FnMut(Progress),
) -> io::Result<Vec<String>> {
    let mut messages = Vec::new();
    let mut line = Vec::new();
    // A carriage return ends a progress update, so that the next update replaces it.
    for byte in BufReader::new(output).bytes() {
        match byte? {
            b'\r' | b'\n' => take_line(&mut line, &mut messages, progress),
            other => line.push(other),
        }
    }
    take_line(&mut line, &mut messages, progress);
    Ok(messages)
}

fn take_line(line: &mut Vec<u8>, messages: &mut Vec<String>, progress: &mut dyn FnMut(Progress)) {
    let text = String::from_utf8_lossy(line).trim().to_owned();
    line.clear();
    if text.is_empty() {
        return;
    }
    match parse(&text) {
        Some(step) => progress(step),
        None => messages.push(text),
    }
}

/// Reads one progress line, for example `Receiving objects:  45% (45/100)`.
///
/// A phase starts with a capital letter. This excludes `error:` and `fatal:`.
fn parse(line: &str) -> Option<Progress> {
    let line = line.strip_prefix("remote:").unwrap_or(line).trim_start();
    let (phase, rest) = line.split_once(": ")?;
    let is_phase = phase.starts_with(char::is_uppercase)
        && phase
            .chars()
            .all(|char| char.is_alphabetic() || char == ' ');
    let rest = rest.trim_start();
    let digits = rest.chars().take_while(char::is_ascii_digit).count();
    if !is_phase || digits == 0 {
        return None;
    }
    let percent = if rest[digits..].starts_with('%') {
        rest[..digits]
            .parse::<u8>()
            .ok()
            .map(|value| value.min(100))
    } else {
        None
    };
    Some(Progress {
        phase: phase.to_owned(),
        percent,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn step(phase: &str, percent: Option<u8>) -> Option<Progress> {
        Some(Progress {
            phase: phase.to_owned(),
            percent,
        })
    }

    #[test]
    fn reads_the_phase_and_the_percent() {
        let line = "Receiving objects:  45% (450/1000), 1.20 MiB | 300.00 KiB/s";

        assert_eq!(parse(line), step("Receiving objects", Some(45)));
    }

    #[test]
    fn reads_the_progress_of_the_remote() {
        let line = "remote: Counting objects: 100% (3/3), done.";

        assert_eq!(parse(line), step("Counting objects", Some(100)));
    }

    #[test]
    fn reads_a_count_without_a_total() {
        assert_eq!(
            parse("Enumerating objects: 5, done."),
            step("Enumerating objects", None)
        );
    }

    #[test]
    fn ignores_the_lines_that_are_not_progress() {
        for line in [
            "fatal: 3 files would be overwritten",
            "error: failed to push some refs to 'origin'",
            "Total 3 (delta 0), reused 0 (delta 0), pack-reused 0",
            "To github.com:owner/repo.git",
            "Cloning into 'repo'...",
            "Note: switching to 'main'",
        ] {
            assert_eq!(parse(line), None, "{line}");
        }
    }

    #[test]
    fn splits_the_updates_and_keeps_the_messages() {
        let output = b"Cloning into 'x'...\nReceiving objects:  50% (1/2)\rReceiving objects: 100% (2/2), done.\nfatal: stop\n";
        let mut steps = Vec::new();

        let messages = read_output(&output[..], &mut |step| steps.push(step)).unwrap();

        assert_eq!(messages, ["Cloning into 'x'...", "fatal: stop"]);
        let percents: Vec<_> = steps.iter().map(|step| step.percent).collect();
        assert_eq!(percents, [Some(50), Some(100)]);
    }
}
