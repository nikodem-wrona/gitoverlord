//! The typed IPC surface between Rust and the user interface.

use tauri_specta::{Builder, Commands, ErrorHandlingMode, collect_commands, collect_events};

use crate::commands::{
    branches, changes, commit, conflicts, github, history, repository, stash, surgery, sync,
    system, update,
};
use crate::events::{RepoChanged, SyncProgress};

/// Registers each command and each event of the user interface.
///
/// Add new commands to `commands` and new events to this list. Then run `pnpm bindings`.
pub fn builder() -> Builder<tauri::Wry> {
    Builder::<tauri::Wry>::new()
        // A command returns a typed `Result`, so TypeScript knows the error type.
        .error_handling(ErrorHandlingMode::Result)
        // One TypeScript type for each Rust type, not one for each direction.
        .disable_serde_phases()
        .commands(commands())
        .events(collect_events![RepoChanged, SyncProgress])
        .mocks()
}

/// The list of the commands. It is data without logic, so it has no line limit.
#[expect(clippy::too_many_lines, reason = "one line for each command")]
fn commands() -> Commands<tauri::Wry> {
    collect_commands![
        system::detect_git,
        repository::pick_folder,
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
        surgery::merge_branch,
        surgery::rebase_branch,
        surgery::cherry_pick,
        surgery::revert_commit,
        surgery::continue_operation,
        surgery::skip_operation,
        surgery::abort_operation,
        surgery::reset_branch,
        surgery::undo_reset,
        surgery::restore_head,
        conflicts::conflict_file,
        conflicts::resolve_conflict,
        conflicts::restore_conflict,
        sync::repo_remotes,
        sync::add_remote,
        sync::fetch_remotes,
        sync::pull_branch,
        sync::push_branch,
        sync::publish_branch,
        sync::force_push_branch,
        sync::undo_force_push,
        sync::clone_repository,
        github::github_account,
        github::github_start_sign_in,
        github::github_poll_sign_in,
        github::github_sign_out,
        github::github_repositories,
        github::github_pull_requests,
        github::github_create_pull_request,
        github::open_github_page,
        update::check_for_update,
        update::install_update,
    ]
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
