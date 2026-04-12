use std::env;

use zed::settings::ContextServerSettings;
use zed_extension_api::{
    self as zed, ContextServerConfiguration, ContextServerId, DownloadedFileType, Project, Result,
};

const CONTEXT_SERVER_ID: &str = "markdown-pdf";

/// GitHub repository from which the MCP server is downloaded.
const GITHUB_REPO: &str = "matinfo/zed-markdown-pdf";

/// Git tag used to identify the server release asset.
/// Update this constant (and cut a matching GitHub release) whenever the
/// server script or its bundled CSS changes.
const SERVER_RELEASE_TAG: &str = "server-v0.1.2";

/// Name of the `.tar.gz` asset that must be attached to the release.
/// The archive must contain these files/directories at its root (no subdirectory wrapper):
///   - markdown_pdf_server.mjs
///   - default.css
///   - package.json
///   - package-lock.json
///   - lib/
const SERVER_ASSET_NAME: &str = "markdown-pdf-server.tar.gz";

/// Destination directory inside the extension's working directory where the
/// archive is extracted.  After extraction the layout will be:
///   <work_dir>/server/markdown_pdf_server.mjs
///   <work_dir>/server/default.css
///   <work_dir>/server/package.json
const SERVER_DIR: &str = "server";

/// Path (relative to `work_dir`) of the entry-point script.
const SERVER_SCRIPT: &str = "server/markdown_pdf_server.mjs";

struct MarkdownPdfExtension;

impl MarkdownPdfExtension {
    /// Return the absolute path to the MCP server script, downloading it from
    /// the GitHub release first if it is not already present in the extension
    /// working directory.
    fn server_script_path(&self) -> Result<String> {
        let work_dir = env::current_dir()
            .map_err(|err| format!("failed to resolve extension working directory: {err}"))?;

        let server_script = work_dir.join(SERVER_SCRIPT);

        if !server_script.exists() {
            let release = zed::github_release_by_tag_name(GITHUB_REPO, SERVER_RELEASE_TAG)?;

            let asset = release
                .assets
                .iter()
                .find(|a| a.name == SERVER_ASSET_NAME)
                .ok_or_else(|| {
                    format!(
                        "release {} of {} has no asset named '{}'",
                        SERVER_RELEASE_TAG, GITHUB_REPO, SERVER_ASSET_NAME
                    )
                })?;

            zed::download_file(&asset.download_url, SERVER_DIR, DownloadedFileType::GzipTar)
                .map_err(|e| format!("failed to download markdown-pdf server: {e}"))?;
        }

        Ok(server_script.to_string_lossy().into_owned())
    }

    /// Read user settings from the project's `settings.json` and return them
    /// as a `serde_json::Value`. Returns an empty object `{}` when no settings
    /// are configured or when reading fails.
    fn user_settings(project: &Project) -> serde_json::Value {
        ContextServerSettings::for_project(CONTEXT_SERVER_ID, project)
            .ok()
            .and_then(|settings| settings.settings)
            .unwrap_or_else(|| serde_json::json!({}))
    }

    fn settings_env(project: &Project) -> Result<Vec<(String, String)>> {
        let settings = Self::user_settings(project);
        Ok(vec![(
            "MARKDOWN_PDF_SETTINGS".to_string(),
            settings.to_string(),
        )])
    }

    /// Deep-merge `overlay` into `base`. For objects, keys from `overlay`
    /// override keys in `base` recursively. For all other types, `overlay`
    /// replaces `base` entirely.
    fn deep_merge(base: &mut serde_json::Value, overlay: &serde_json::Value) {
        match (base, overlay) {
            (serde_json::Value::Object(base_map), serde_json::Value::Object(overlay_map)) => {
                for (key, overlay_value) in overlay_map {
                    let entry = base_map
                        .entry(key.clone())
                        .or_insert(serde_json::Value::Null);
                    Self::deep_merge(entry, overlay_value);
                }
            }
            (base, overlay) => {
                *base = overlay.clone();
            }
        }
    }

    /// Build the effective settings by merging the static defaults with the
    /// user's overrides from `settings.json`. This is returned as
    /// `default_settings` so that the "Configure Server" modal in Zed shows
    /// the user's current effective configuration rather than bare defaults.
    fn effective_settings(project: &Project) -> String {
        let default_json = include_str!("../configuration/default_settings.json");
        let mut base: serde_json::Value =
            serde_json::from_str(default_json).unwrap_or_else(|_| serde_json::json!({}));

        let user = Self::user_settings(project);

        // Only merge if the user has provided an object with at least one key.
        if let serde_json::Value::Object(ref map) = user {
            if !map.is_empty() {
                Self::deep_merge(&mut base, &user);
            }
        }

        // Pretty-print with 2-space indentation for readability in the modal.
        serde_json::to_string_pretty(&base).unwrap_or_else(|_| default_json.to_string())
    }
}

impl zed::Extension for MarkdownPdfExtension {
    fn new() -> Self {
        Self
    }

    fn context_server_command(
        &mut self,
        context_server_id: &ContextServerId,
        project: &Project,
    ) -> Result<zed::Command> {
        if context_server_id.as_ref() != CONTEXT_SERVER_ID {
            return Err(format!("unknown context server: {context_server_id}"));
        }

        Ok(zed::Command {
            command: zed::node_binary_path()?,
            args: vec![self.server_script_path()?],
            env: Self::settings_env(project)?,
        })
    }

    fn context_server_configuration(
        &mut self,
        context_server_id: &ContextServerId,
        project: &Project,
    ) -> Result<Option<ContextServerConfiguration>> {
        if context_server_id.as_ref() != CONTEXT_SERVER_ID {
            return Ok(None);
        }

        let installation_instructions =
            include_str!("../configuration/installation_instructions.md").to_string();

        let settings_schema = include_str!("../configuration/settings_schema.json").to_string();

        // Merge the user's current settings on top of the defaults so that the
        // "Configure Server" modal reflects the effective configuration, not
        // just the bare defaults.
        let default_settings = Self::effective_settings(project);

        Ok(Some(ContextServerConfiguration {
            installation_instructions,
            settings_schema,
            default_settings,
        }))
    }
}

zed::register_extension!(MarkdownPdfExtension);
