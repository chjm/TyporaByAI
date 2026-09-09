/**
 * IPC 命令封装。
 *
 * 统一封装前端到 Rust 后端的 `invoke` 调用，屏蔽命令名与参数命名细节。
 * 注意：Tauri 2 命令名保持 snake_case，参数名默认为 camelCase。
 */

import { invoke } from '@tauri-apps/api/core';
import type { AppConfig, FileMeta, FileNode } from './types';

/** 遍历目录生成文件树。 */
export function listDirectory(path: string): Promise<FileNode[]> {
  return invoke<FileNode[]>('list_directory', { path });
}

/** 读取文本文件内容。 */
export function readFile(path: string): Promise<string> {
  return invoke<string>('read_file', { path });
}

/** 写入文本内容到文件。 */
export function writeFile(path: string, content: string): Promise<void> {
  return invoke<void>('write_file', { path, content });
}

/** 新建文件或目录。 */
export function createFile(path: string, isDir: boolean): Promise<void> {
  return invoke<void>('create_file', { path, isDir });
}

/** 重命名文件或目录。 */
export function renameFile(path: string, newName: string): Promise<void> {
  return invoke<void>('rename_file', { path, newName });
}

/** 删除文件或目录。 */
export function deleteFile(path: string): Promise<void> {
  return invoke<void>('delete_file', { path });
}

/** 保存 base64 图片并返回相对路径。 */
export function saveImage(dir: string, name: string, base64Data: string): Promise<string> {
  return invoke<string>('save_image', { dir, name, base64Data });
}

/** 获取文件元数据。 */
export function getFileMeta(path: string): Promise<FileMeta> {
  return invoke<FileMeta>('get_file_meta', { path });
}

/** 判断路径是否为目录。 */
export function isDir(path: string): Promise<boolean> {
  return invoke<boolean>('is_dir', { path });
}

/** 获取通过文件关联启动时传入的文件路径。 */
export function getOpenFile(): Promise<string | null> {
  return invoke<string | null>('get_open_file');
}

/** 读取应用配置。 */
export function getConfig(): Promise<AppConfig> {
  return invoke<AppConfig>('get_config');
}

/** 写入应用配置。 */
export function setConfig(config: AppConfig): Promise<void> {
  return invoke<void>('set_config', { config });
}
