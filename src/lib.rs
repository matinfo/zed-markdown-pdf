use std::env;

use zed::settings::ContextServerSettings;
use zed_extension_api::{
    self as zed, ContextServerConfiguration, ContextServerId, Project, Result,
};

const CONTEXT_SERVER_ID: &str = "markdown-pdf";
const SERVER_PATH: &str = "server/markdown_pdf_server.mjs";

struct MarkdownPdfExtension;

impl MarkdownPdfExtension {
    /// Build the absolute path to the bundled server script.
    ///
    /// Zed runs WASM extensions from `extensions/work/<id>/` but bundled
    /// files live in `extensions/installed/<id>/`. The WASM sandbox cannot
    /// read the installed directory, so we construct the path directly
    /// without a filesystem check. Zed itself executes the Command outside
    /// the sandbox, so the path only needs to be correct, not readable
    /// from within WASM.
    fn server_script_path(&self) -> Result<String> {
        let work_dir = env::current_dir()
            .map_err(|err| format!("failed to resolve extension directory: {err}"))?;

        let server_path = work_dir
            .parent()
            .and_then(|p| p.parent())
            .map(|extensions_root| {
                extensions_root
                    .join("installed")
                    .join(CONTEXT_SERVER_ID)
                    .join(SERVER_PATH)
            })
            .ok_or_else(|| format!("unexpected work directory layout: {}", work_dir.display()))?;

        Ok(server_path.to_string_lossy().into_owned())
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
