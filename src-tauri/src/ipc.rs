//! The typed IPC surface between Rust and the user interface.

use tauri_specta::{Builder, ErrorHandlingMode, collect_commands};

use crate::commands;

/// Registers each command that the user interface can call.
///
/// Add new commands to this list. Then run `pnpm bindings`.
pub fn builder() -> Builder<tauri::Wry> {
    Builder::<tauri::Wry>::new()
        // A command returns a typed `Result`, so TypeScript knows the error type.
        .error_handling(ErrorHandlingMode::Result)
        .commands(collect_commands![commands::system::detect_git])
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
