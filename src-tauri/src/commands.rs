//! 命令模块。
//!
//! 定义并暴露供前端调用的 Tauri 命令，作为前端与 [`filesystem`]、
//! [`config`] 模块之间的薄封装层，负责参数与返回值的类型边界。

use tauri::AppHandle;

use crate::config::{self, AppConfig};
use crate::filesystem::{self, FileMeta, FileNode};

/// 遍历目录生成文件树。
///
/// @param path 目录绝对路径
/// @return 文件节点列表
#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<FileNode>, String> {
    filesystem::list_directory(&path)
}

/// 读取文本文件内容。
///
/// @param path 文件绝对路径
/// @return 文件内容
#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    filesystem::read_file(&path)
}

/// 写入文本内容到文件。
///
/// @param path 文件绝对路径
/// @param content 内容
#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    filesystem::write_file(&path, &content)
}

/// 新建文件或目录。
///
/// @param path 目标绝对路径
/// @param is_dir 是否为目录
#[tauri::command]
pub fn create_file(path: String, is_dir: bool) -> Result<(), String> {
    filesystem::create_file(&path, is_dir)
}

/// 重命名文件或目录。
///
/// @param path 原绝对路径
/// @param new_name 新名称（不含目录）
#[tauri::command]
pub fn rename_file(path: String, new_name: String) -> Result<(), String> {
    filesystem::rename_file(&path, &new_name)
}

/// 删除文件或目录。
///
/// @param path 目标绝对路径
#[tauri::command]
pub fn delete_file(path: String) -> Result<(), String> {
    filesystem::delete_file(&path)
}

/// 保存 base64 图片并返回相对路径。
///
/// @param dir 保存目录
/// @param name 文件名
/// @param base64_data base64 数据
/// @return 图片相对路径
#[tauri::command]
pub fn save_image(dir: String, name: String, base64_data: String) -> Result<String, String> {
    filesystem::save_image(&dir, &name, &base64_data)
}

/// 获取文件元数据。
///
/// @param path 文件绝对路径
/// @return 文件元数据
#[tauri::command]
pub fn get_file_meta(path: String) -> Result<FileMeta, String> {
    filesystem::get_file_meta(&path)
}

/// 读取应用配置。
///
/// @param app Tauri 应用句柄
/// @return 应用配置
#[tauri::command]
pub fn get_config(app: AppHandle) -> AppConfig {
    config::load_config(&app)
}

/// 写入应用配置。
///
/// @param app Tauri 应用句柄
/// @param config 应用配置
#[tauri::command]
pub fn set_config(app: AppHandle, config: AppConfig) -> Result<(), String> {
    config::save_config(&app, &config)
}
