//! 配置模块。
//!
//! 负责应用配置（主题、最近打开文件等）的加载与持久化，配置文件
//! 保存在应用配置目录（由 Tauri 提供）下的 `config.json`。

use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::Manager;

/// 应用配置。
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase", default)]
pub struct AppConfig {
    /// 主题标识：`light` / `dark`
    pub theme: String,
    /// 最近打开的文件列表（绝对路径）
    pub recent_files: Vec<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            theme: "light".to_string(),
            recent_files: Vec::new(),
        }
    }
}

/// 计算配置文件路径。
///
/// @param app Tauri 应用句柄
/// @return 配置文件绝对路径
/// @throws 无法获取配置目录时返回错误信息
fn config_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|e| format!("无法获取配置目录: {}", e))?;
    Ok(dir.join("config.json"))
}

/// 加载应用配置，文件不存在或解析失败时返回默认值。
///
/// @param app Tauri 应用句柄
/// @return 应用配置
pub fn load_config(app: &tauri::AppHandle) -> AppConfig {
    let path = match config_path(app) {
        Ok(p) => p,
        Err(_) => return AppConfig::default(),
    };
    fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str::<AppConfig>(&s).ok())
        .unwrap_or_default()
}

/// 保存应用配置到磁盘。
///
/// @param app Tauri 应用句柄
/// @param config 要保存的配置
/// @return 成功返回 Ok(())
/// @throws 目录创建、序列化或写入失败时返回错误信息
pub fn save_config(app: &tauri::AppHandle, config: &AppConfig) -> Result<(), String> {
    let path = config_path(app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("无法创建配置目录: {}", e))?;
    }
    let data = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| format!("无法写入配置: {}", e))
}
