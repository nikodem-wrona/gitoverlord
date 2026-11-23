//! The typed IPC surface between Rust and the user interface.

use tauri_specta::{Builder, ErrorHandlingMode, collect_commands, collect_events};

use crate::commands::{branches, changes, commit, history, repository, stash, system};
use crate::events::RepoChanged;

/// Registers each command and each event of the user interface.
///
/// Add new commands and events to these lists. Then run `pnpm bindings`.
pub fn builder() -> Builder<tauri::Wry> {
    Builder::<tauri::Wry>::new()
        // A command returns a typed `Result`, so TypeScript knows the error type.
        .error_handling(ErrorHandlingMode::Result)
        // One TypeScript type for each Rust type, not one for each direction.
        .disable_serde_phases()
        .commands(collect_commands![
            system::detect_git,
            repository::pick_repository,
            repository::open_repository,
            repository::recent_repositories,
            repository::repo_summary,
            repository::repo_activity,
            history::repo_log,
            history::commit_detail,
            changes::repo_status,
            changes::file_diff,
            changes::stage_files,
            changes::unstage_files,
            changes::stage_hunk,
            changes::unstage_hunk,
            changes::discard_changes,
            changes::restore_discarded,
            commit::commit_changes,
            branches::repo_branches,
            branches::create_branch,
            branches::restore_branch,
            branches::switch_branch,
            branches::rename_branch,
            branches::delete_branch,
            stash::repo_stashes,
            stash::stash_changes,
            stash::apply_stash,
            stash::pop_stash,
            stash::drop_stash,
            stash::restore_stash,
        ])
        .events(collect_events![RepoChanged])
        .mocks()
}

#[cfg(test)]
mod tests {
    use specta_typescript::Typescript;

    const BINDINGS_PATH: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/../src/ipc/bindings.ts");

    /// Writes the TypeScript bindings. CI fails if the committed file is out of date.
    #[test]
    fn export_bindings() {
        super::builder()
            .export(Typescript::default(), BINDINGS_PATH)
            .expect("failed to export the TypeScript bindings");
    }
}
