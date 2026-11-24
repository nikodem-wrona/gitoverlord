use serde::Serialize;
use specta::Type;

/// One entry of the stash.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct StashEntry {
    /// The position in the list, as in `stash@{0}`. The newest entry is 0.
    pub index: u32,
    /// The hash of the stash commit. Each stash command takes this value.
    pub hash: String,
    /// The message, for example `On main: try a new layout`.
    pub message: String,
    /// The time when the entry was made, in Unix seconds.
    // TypeScript has one number type. `i32` gives `number` in the bindings.
    #[specta(type = i32)]
    pub time: i64,
}
