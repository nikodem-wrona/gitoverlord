//! The build script of the Tauri shell.

use std::env;

use tauri_build::{Attributes, WindowsAttributes};

const WINDOWS_MANIFEST: &str = "windows-app-manifest.xml";

fn main() {
    let mut attributes = Attributes::new();
    if targets_windows_msvc() {
        // tauri-build puts the manifest only in the application binary. A test
        // executable without the manifest does not start on Windows. Thus the
        // linker puts the manifest in each target.
        attributes = attributes.windows_attributes(WindowsAttributes::new_without_app_manifest());
        embed_windows_manifest();
    }
    tauri_build::try_build(attributes).expect("failed to run tauri-build");
}

fn targets_windows_msvc() -> bool {
    let target_os = env::var("CARGO_CFG_TARGET_OS");
    let target_env = env::var("CARGO_CFG_TARGET_ENV");
    target_os.as_deref() == Ok("windows") && target_env.as_deref() == Ok("msvc")
}

/// Tells the MSVC linker to embed the manifest in each executable of this crate.
fn embed_windows_manifest() {
    let manifest = env::current_dir()
        .expect("the build script has no working directory")
        .join(WINDOWS_MANIFEST);
    println!("cargo:rerun-if-changed={}", manifest.display());
    println!("cargo:rustc-link-arg=/MANIFEST:EMBED");
    println!("cargo:rustc-link-arg=/MANIFESTINPUT:{}", manifest.display());
}
