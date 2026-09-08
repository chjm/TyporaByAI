//! 文件系统模块。
//!
//! 封装目录遍历、文件读写、新建/重命名/删除、图片落盘、元数据读取等
//! 本地文件操作。所有接口均以绝对路径字符串为参数，由前端传入；
//! 写操作会自动创建缺失的父目录。

use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

use serde::Serialize;

/// 文件树节点。
#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileNode {
    /// 文件或目录名称
    pub name: String,
    /// 绝对路径
    pub path: String,
    /// 是否为目录
    pub is_dir: bool,
    /// 子节点列表（仅目录存在时序列化）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<FileNode>>,
}

/// 文件元数据（用于外部修改检测）。
#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileMeta {
    /// 最后修改时间（毫秒时间戳）
    pub modified_ms: u64,
    /// 文件大小（字节）
    pub size: u64,
}

/// 遍历目录生成文件树（目录在前、文件在后，均按名称不区分大小写排序）。
///
/// @param path 目录绝对路径
/// @return 该目录下的文件节点列表
/// @throws 目录不存在或无法读取时返回错误信息
pub fn list_directory(path: &str) -> Result<Vec<FileNode>, String> {
    let entries = fs::read_dir(path).map_err(|e| format!("无法读取目录 {}: {}", path, e))?;

    let mut dirs: Vec<FileNode> = Vec::new();
    let mut files: Vec<FileNode> = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let entry_path = entry.path();
        let is_dir = entry_path.is_dir();

        // 目录全部展示，文件仅展示 markdown / 常见文本类型
        if !is_dir && !is_text_file(&entry_path) {
            continue;
        }

        let node = FileNode {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry_path.to_string_lossy().to_string(),
            is_dir,
            children: if is_dir { Some(Vec::new()) } else { None },
        };

        if is_dir {
            dirs.push(node);
        } else {
            files.push(node);
        }
    }

    dirs.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    dirs.extend(files);
    Ok(dirs)
}

/// 判断路径是否为应展示的文本文件。
///
/// @param path 文件路径
/// @return 是文本文件返回 true
fn is_text_file(path: &Path) -> bool {
    matches!(
        path.extension()
            .and_then(|e| e.to_str())
            .map(|e| e.to_lowercase())
            .as_deref(),
        Some("md") | Some("markdown") | Some("mdown") | Some("mkd") | Some("txt")
    )
}

/// 读取文本文件内容。
///
/// @param path 文件绝对路径
/// @return 文件内容字符串
/// @throws 文件不存在、无权限或非 UTF-8 时返回错误信息
pub fn read_file(path: &str) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| format!("无法读取文件 {}: {}", path, e))
}

/// 将文本内容写入文件（自动创建父目录）。
///
/// @param path 文件绝对路径
/// @param content 要写入的内容
/// @return 成功返回 Ok(())
/// @throws 父目录创建失败或写入失败时返回错误信息
pub fn write_file(path: &str, content: &str) -> Result<(), String> {
    if let Some(parent) = Path::new(path).parent() {
        fs::create_dir_all(parent).map_err(|e| format!("无法创建父目录: {}", e))?;
    }
    fs::write(path, content).map_err(|e| format!("无法写入文件 {}: {}", path, e))
}

/// 新建文件或目录。
///
/// @param path 目标绝对路径
/// @param is_dir 是否为目录
/// @return 成功返回 Ok(())
/// @throws 目标已存在或创建失败时返回错误信息
pub fn create_file(path: &str, is_dir: bool) -> Result<(), String> {
    let p = Path::new(path);
    if p.exists() {
        return Err(format!("目标已存在: {}", path));
    }
    if is_dir {
        fs::create_dir_all(p).map_err(|e| format!("无法创建目录: {}", e))
    } else {
        if let Some(parent) = p.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("无法创建父目录: {}", e))?;
        }
        fs::File::create(p)
            .map(|_| ())
            .map_err(|e| format!("无法创建文件: {}", e))
    }
}

/// 重命名文件或目录。
///
/// @param path 原绝对路径
/// @param new_name 新名称（不含目录部分）
/// @return 成功返回 Ok(())
/// @throws 目标已存在或重命名失败时返回错误信息
pub fn rename_file(path: &str, new_name: &str) -> Result<(), String> {
    let src = Path::new(path);
    let parent = src
        .parent()
        .ok_or_else(|| "无法解析父目录".to_string())?;
    let dst = parent.join(new_name);
    if dst.exists() {
        return Err(format!("目标已存在: {}", dst.to_string_lossy()));
    }
    fs::rename(src, &dst).map_err(|e| format!("无法重命名: {}", e))
}

/// 删除文件或目录（目录递归删除）。
///
/// @param path 目标绝对路径
/// @return 成功返回 Ok(())
/// @throws 删除失败时返回错误信息
pub fn delete_file(path: &str) -> Result<(), String> {
    let p = Path::new(path);
    if p.is_dir() {
        fs::remove_dir_all(p).map_err(|e| format!("无法删除目录: {}", e))
    } else {
        fs::remove_file(p).map_err(|e| format!("无法删除文件: {}", e))
    }
}

/// 将 base64 编码的图片写入指定目录，返回相对路径。
///
/// @param dir 图片保存目录绝对路径
/// @param name 文件名（不含路径部分）
/// @param base64_data 图片的 base64 编码（不含 `data:` 前缀）
/// @return 图片相对文档目录的路径（如 `assets/xxx.png`）
/// @throws base64 解码失败或写入失败时返回错误信息
pub fn save_image(dir: &str, name: &str, base64_data: &str) -> Result<String, String> {
    let bytes = base64_decode(base64_data)?;
    fs::create_dir_all(dir).map_err(|e| format!("无法创建图片目录: {}", e))?;
    let file_path = PathBuf::from(dir).join(name);
    let mut f =
        fs::File::create(&file_path).map_err(|e| format!("无法创建图片文件: {}", e))?;
    f.write_all(&bytes)
        .map_err(|e| format!("无法写入图片: {}", e))?;
    Ok(name.to_string())
}

/// 解码 base64 字符串为字节数组。
///
/// @param data base64 编码字符串
/// @return 解码后的字节数组
/// @throws 解码失败时返回错误信息
fn base64_decode(data: &str) -> Result<Vec<u8>, String> {
    use base64::Engine;
    base64::engine::general_purpose::STANDARD
        .decode(data)
        .map_err(|e| format!("base64 解码失败: {}", e))
}

/// 获取文件元数据（最后修改时间与大小）。
///
/// @param path 文件绝对路径
/// @return 文件元数据
/// @throws 文件不存在或无法获取时返回错误信息
pub fn get_file_meta(path: &str) -> Result<FileMeta, String> {
    let meta = fs::metadata(path).map_err(|e| format!("无法获取文件信息: {}", e))?;
    let modified = meta
        .modified()
        .unwrap_or(UNIX_EPOCH)
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    Ok(FileMeta {
        modified_ms: modified,
        size: meta.len(),
    })
}
