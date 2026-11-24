//! Reads and resolves the conflict markers that `git` writes in a file.
//!
//! Each line keeps its line ending, so a resolved file keeps the line endings of the file.

use crate::GitError;
use crate::model::ConflictChoice;

const OURS: &str = "<<<<<<<";
const BASE: &str = "|||||||";
const SPLIT: &str = "=======";
const THEIRS: &str = ">>>>>>>";

/// A part of a file.
#[derive(Debug, PartialEq, Eq)]
pub(crate) enum Part<'a> {
    Clean(Vec<&'a str>),
    Conflict(Hunk<'a>),
}

/// One conflict. A diff3 file also has the base lines. They are not kept.
#[derive(Debug, Default, PartialEq, Eq)]
pub(crate) struct Hunk<'a> {
    /// The position of the `<<<<<<<` line. The first line is 0.
    pub(crate) line: usize,
    pub(crate) ours_label: &'a str,
    pub(crate) theirs_label: &'a str,
    pub(crate) ours: Vec<&'a str>,
    pub(crate) theirs: Vec<&'a str>,
}

impl<'a> Hunk<'a> {
    fn chosen(&self, choice: ConflictChoice) -> impl Iterator<Item = &&'a str> {
        let (ours, theirs) = match choice {
            ConflictChoice::Ours => (&self.ours[..], &[][..]),
            ConflictChoice::Theirs => (&[][..], &self.theirs[..]),
            ConflictChoice::Both => (&self.ours[..], &self.theirs[..]),
        };
        ours.iter().chain(theirs)
    }
}

/// Splits `text` into clean parts and conflicts. A conflict without an end marker is clean text.
pub(crate) fn parse(text: &str) -> Vec<Part<'_>> {
    let mut parser = Parser::default();
    for (index, line) in text.split_inclusive('\n').enumerate() {
        parser.read(index, line);
    }
    parser.finish()
}

/// Replaces each conflict of `text` with the lines of its choice.
///
/// There must be one choice for each conflict. Else the file changed after the user saw it.
pub(crate) fn resolve(text: &str, choices: &[ConflictChoice]) -> Result<String, GitError> {
    let parts = parse(text);
    let conflicts = parts
        .iter()
        .filter(|part| matches!(part, Part::Conflict(_)))
        .count();
    if conflicts != choices.len() {
        return Err(GitError::Rejected(
            "The file changed. Look at its conflicts again.".to_owned(),
        ));
    }
    let mut choices = choices.iter();
    let mut resolved = String::with_capacity(text.len());
    for part in &parts {
        match part {
            Part::Clean(lines) => resolved.extend(lines.iter().copied()),
            Part::Conflict(hunk) => {
                let choice = choices.next().copied().unwrap_or(ConflictChoice::Both);
                resolved.extend(hunk.chosen(choice).copied());
            }
        }
    }
    Ok(resolved)
}

/// Removes the line ending.
pub(crate) fn without_ending(line: &str) -> &str {
    let line = line.strip_suffix('\n').unwrap_or(line);
    line.strip_suffix('\r').unwrap_or(line)
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Section {
    Ours,
    Base,
    Theirs,
}

/// An open conflict: the hunk so far, and its lines as they are in the file.
struct Open<'a> {
    hunk: Hunk<'a>,
    section: Section,
    raw: Vec<&'a str>,
}

#[derive(Default)]
struct Parser<'a> {
    parts: Vec<Part<'a>>,
    clean: Vec<&'a str>,
    open: Option<Open<'a>>,
}

impl<'a> Parser<'a> {
    fn read(&mut self, index: usize, line: &'a str) {
        let Some(mut open) = self.open.take() else {
            self.read_clean(index, line);
            return;
        };
        open.raw.push(line);
        match open.section {
            Section::Ours if is_marker(line, BASE) => open.section = Section::Base,
            Section::Ours | Section::Base if is_split(line) => open.section = Section::Theirs,
            Section::Ours => open.hunk.ours.push(line),
            Section::Base => {}
            Section::Theirs if is_marker(line, THEIRS) => {
                open.hunk.theirs_label = label(line);
                self.parts.push(Part::Conflict(open.hunk));
                return;
            }
            Section::Theirs => open.hunk.theirs.push(line),
        }
        self.open = Some(open);
    }

    fn read_clean(&mut self, index: usize, line: &'a str) {
        if !is_marker(line, OURS) {
            self.clean.push(line);
            return;
        }
        self.flush();
        let hunk = Hunk {
            line: index,
            ours_label: label(line),
            ..Hunk::default()
        };
        self.open = Some(Open {
            hunk,
            section: Section::Ours,
            raw: vec![line],
        });
    }

    fn flush(&mut self) {
        if !self.clean.is_empty() {
            self.parts
                .push(Part::Clean(std::mem::take(&mut self.clean)));
        }
    }

    fn finish(mut self) -> Vec<Part<'a>> {
        if let Some(open) = self.open.take() {
            // The clean lines before the open conflict are a part already.
            match self.parts.last_mut() {
                Some(Part::Clean(lines)) => lines.extend(open.raw),
                _ => self.clean.extend(open.raw),
            }
        }
        self.flush();
        self.parts
    }
}

/// A marker is seven characters at the start of the line, then the end or a space.
fn is_marker(line: &str, marker: &str) -> bool {
    line.strip_prefix(marker)
        .is_some_and(|rest| rest.is_empty() || rest.starts_with([' ', '\t', '\r', '\n']))
}

fn is_split(line: &str) -> bool {
    without_ending(line) == SPLIT
}

fn label(line: &str) -> &str {
    line.get(OURS.len()..).unwrap_or_default().trim()
}

#[cfg(test)]
mod tests {
    use super::*;

    const FILE: &str = "one\n<<<<<<< HEAD\nours\n=======\ntheirs\nmore\n>>>>>>> feature\nend\n";

    #[test]
    fn splits_a_file_into_clean_parts_and_conflicts() {
        let parts = parse(FILE);

        let expected = Hunk {
            line: 1,
            ours_label: "HEAD",
            theirs_label: "feature",
            ours: vec!["ours\n"],
            theirs: vec!["theirs\n", "more\n"],
        };
        assert_eq!(
            parts,
            [
                Part::Clean(vec!["one\n"]),
                Part::Conflict(expected),
                Part::Clean(vec!["end\n"]),
            ]
        );
    }

    #[test]
    fn resolves_each_conflict_with_its_choice() {
        let two = format!("{FILE}{FILE}");
        let choices = [ConflictChoice::Theirs, ConflictChoice::Both];

        let resolved = resolve(&two, &choices).unwrap();

        assert_eq!(
            resolved,
            "one\ntheirs\nmore\nend\none\nours\ntheirs\nmore\nend\n"
        );
    }

    #[test]
    fn skips_the_base_lines_of_a_diff3_conflict() {
        let text = "<<<<<<< ours\na\n||||||| base\nb\n=======\nc\n>>>>>>> theirs\n";

        let resolved = resolve(text, &[ConflictChoice::Both]).unwrap();

        assert_eq!(resolved, "a\nc\n");
    }

    #[test]
    fn keeps_the_line_endings_of_the_file() {
        let text = "a\r\n<<<<<<< HEAD\r\nb\r\n=======\r\nc\r\n>>>>>>> x\r\nd";

        let resolved = resolve(text, &[ConflictChoice::Ours]).unwrap();

        assert_eq!(resolved, "a\r\nb\r\nd");
    }

    #[test]
    fn reads_a_conflict_without_an_end_marker_as_clean_text() {
        let text = "a\n<<<<<<< HEAD\nb\n";

        assert_eq!(
            parse(text),
            [Part::Clean(vec!["a\n", "<<<<<<< HEAD\n", "b\n"])]
        );
    }

    #[test]
    fn rejects_a_count_of_choices_that_does_not_match_the_file() {
        let error = resolve(FILE, &[]).unwrap_err();

        assert!(matches!(error, GitError::Rejected(_)), "error: {error:?}");
    }

    #[test]
    fn does_not_read_a_longer_run_of_marker_characters_as_a_marker() {
        let text = "<<<<<<<<< not a marker\n";

        assert_eq!(parse(text), [Part::Clean(vec![text])]);
    }
}
