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
const SERVER_RELEASE_TAG: &str = "server-v0.1.1";

/// Name of the `.tar.gz` asset that must be attached to the release.
/// The archive must contain these files/directories at its root (no subdirectory wrapper):
///   - markdown_pdf_server.mjs
///   - default.css
///   - package.json
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

    fn settings_env(project: &Project) -> Result<Vec<(String, String)>> {
        let settings = ContextServerSettings::for_project(CONTEXT_SERVER_ID, project)
            .ok()
            .and_then(|settings| settings.settings)
            .unwrap_or_else(|| serde_json::json!({}));

        Ok(vec![(
            "MARKDOWN_PDF_SETTINGS".to_string(),
            settings.to_string(),
        )])
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
        _project: &Project,
    ) -> Result<Option<ContextServerConfiguration>> {
        if context_server_id.as_ref() != CONTEXT_SERVER_ID {
            return Ok(None);
        }

        let installation_instructions =
            include_str!("../configuration/installation_instructions.md").to_string();

        let settings_schema = include_str!("../configuration/settings_schema.json").to_string();

        let default_settings = include_str!("../configuration/default_settings.json").to_string();

        Ok(Some(ContextServerConfiguration {
            installation_instructions,
            settings_schema,
            default_settings,
        }))
    }
}

zed::register_extension!(MarkdownPdfExtension);
