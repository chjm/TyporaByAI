/**
 * 应用状态与文件操作。
 *
 * 使用 Svelte 5 runes 定义跨组件共享的响应式状态（单一 `$state` 对象），
 * 并封装文件树、文件读写、配置持久化等仅依赖 IPC 的动作。
 */

import * as ipc from '$lib/ipc';
import { applyTheme } from '$lib/theme';
import { dirname } from '$lib/utils';
import type { AppConfig, FileNode } from '$lib/types';

// ---------------------------------------------------------------------------
// 状态
// ---------------------------------------------------------------------------

/** 应用状态结构。 */
interface AppState {
  /** 当前打开的文件夹根路径。 */
  rootPath: string;
  /** 根目录文件树。 */
  fileTree: FileNode[];
  /** 各目录的子节点缓存（懒加载）。 */
  childrenByPath: Record<string, FileNode[]>;
  /** 目录展开状态。 */
  expandedPaths: Record<string, boolean>;
  /** 当前打开的文件路径。 */
  currentFile: string;
  /** 当前文档的 markdown 内容。 */
  content: string;
  /** 是否有未保存修改。 */
  dirty: boolean;
  /** 状态栏保存状态文本。 */
  saveStatus: string;
  /** 上次保存时文件的修改时间（毫秒），用于外部修改检测。 */
  lastSavedMtime: number;
  /** 源码模式开关。 */
  sourceMode: boolean;
  /** 当前主题。 */
  theme: 'light' | 'dark';
  /** 应用配置。 */
  config: AppConfig;
  /** 左侧文件树侧边栏可见性。 */
  showSidebar: boolean;
  /** 右侧大纲侧边栏可见性。 */
  showOutline: boolean;
  /** 查找替换面板可见性。 */
  showFindReplace: boolean;
  /** 源码模式的文本缓冲。 */
  sourceText: string;
}

/** 全局共享的响应式应用状态。 */
export const app = $state<AppState>({
  rootPath: '',
  fileTree: [],
  childrenByPath: {},
  expandedPaths: {},
  currentFile: '',
  content: '',
  dirty: false,
  saveStatus: 'No file open',
  lastSavedMtime: 0,
  sourceMode: false,
  theme: 'light',
  config: { theme: 'light', recentFiles: [] },
  showSidebar: true,
  showOutline: true,
  showFindReplace: false,
  sourceText: '',
});

// ---------------------------------------------------------------------------
// 配置
// ---------------------------------------------------------------------------

/**
 * 加载应用配置并应用主题。
 */
export async function loadConfig(): Promise<void> {
  app.config = await ipc.getConfig();
  app.theme = app.config.theme === 'dark' ? 'dark' : 'light';
  applyTheme(app.theme);
}

/**
 * 持久化当前配置。
 */
async function persistConfig(): Promise<void> {
  app.config = { ...app.config, theme: app.theme };
  await ipc.setConfig(app.config);
}

/**
 * 切换主题并持久化。
 *
 * @param value 目标主题
 */
export async function setTheme(value: 'light' | 'dark'): Promise<void> {
  app.theme = value;
  applyTheme(value);
  await persistConfig();
}

/**
 * 记录最近打开的文件。
 *
 * @param path 文件路径
 */
export async function addRecentFile(path: string): Promise<void> {
  const next = [path, ...app.config.recentFiles.filter((p) => p !== path)].slice(0, 10);
  app.config = { ...app.config, recentFiles: next };
  await ipc.setConfig(app.config);
}

// ---------------------------------------------------------------------------
// 文件树
// ---------------------------------------------------------------------------

/**
 * 打开文件夹并加载根目录文件树。
 *
 * @param path 文件夹绝对路径
 */
export async function openFolder(path: string): Promise<void> {
  app.rootPath = path;
  app.fileTree = await ipc.listDirectory(path);
  app.childrenByPath = {};
  app.expandedPaths = {};
}

/**
 * 加载指定目录的子节点。
 *
 * @param path 目录绝对路径
 * @returns 子节点列表
 */
export async function loadDirectory(path: string): Promise<FileNode[]> {
  const nodes = await ipc.listDirectory(path);
  app.childrenByPath[path] = nodes;
  return nodes;
}

/**
 * 切换目录展开状态（首次展开时懒加载）。
 *
 * @param path 目录绝对路径
 */
export async function toggleExpand(path: string): Promise<void> {
  const willExpand = !app.expandedPaths[path];
  app.expandedPaths[path] = willExpand;
  if (willExpand && !app.childrenByPath[path]) {
    await loadDirectory(path);
  }
}

/**
 * 刷新指定目录的子树。
 *
 * @param path 目录绝对路径
 */
export async function refreshDir(path: string): Promise<void> {
  const nodes = await ipc.listDirectory(path);
  app.childrenByPath[path] = nodes;
  if (path === app.rootPath) {
    app.fileTree = nodes;
  }
}

/**
 * 在指定目录下新建文件或文件夹（名称自动去重）。
 *
 * @param dir 父目录绝对路径
 * @param isDir 是否为文件夹
 * @param baseName 基础名称（不含扩展名，文件时自动追加 .md）
 */
export async function createEntry(dir: string, isDir: boolean, baseName: string): Promise<void> {
  let name = isDir ? baseName : `${baseName}.md`;
  const siblings = app.childrenByPath[dir] ?? (dir === app.rootPath ? app.fileTree : []);
  const exists = (n: string) => siblings.some((s) => s.name === n);
  let i = 1;
  while (exists(name)) {
    name = isDir ? `${baseName}-${i}` : `${baseName}-${i}.md`;
    i += 1;
  }
  const path = dir + (dir.endsWith('/') || dir.endsWith('\\') ? '' : '\\') + name;
  await ipc.createFile(path, isDir);
  await refreshDir(dir);
}

/**
 * 重命名文件或文件夹。
 *
 * @param path 原路径
 * @param newName 新名称
 */
export async function renameEntry(path: string, newName: string): Promise<void> {
  await ipc.renameFile(path, newName);
  await refreshDir(dirname(path));
  if (path === app.currentFile) {
    app.currentFile = dirname(path) + '\\' + newName;
  }
}

/**
 * 删除文件或文件夹。
 *
 * @param path 目标路径
 */
export async function deleteEntry(path: string): Promise<void> {
  await ipc.deleteFile(path);
  await refreshDir(dirname(path));
  if (path === app.currentFile) {
    app.currentFile = '';
    app.content = '';
    app.dirty = false;
    app.saveStatus = 'No file open';
  }
}

// ---------------------------------------------------------------------------
// 界面状态
// ---------------------------------------------------------------------------

/**
 * 切换左侧文件树侧边栏的可见性。
 */
export function toggleSidebar(): void {
  app.showSidebar = !app.showSidebar;
}

/**
 * 切换右侧大纲侧边栏的可见性。
 */
export function toggleOutline(): void {
  app.showOutline = !app.showOutline;
}

/**
 * 切换查找替换面板的可见性。
 */
export function toggleFindReplace(): void {
  app.showFindReplace = !app.showFindReplace;
}

/**
 * 设置源码模式开关。
 *
 * @param value 是否为源码模式
 */
export function setSourceMode(value: boolean): void {
  app.sourceMode = value;
}

/**
 * 设置源码模式的文本缓冲。
 *
 * @param value 文本内容
 */
export function setSourceText(value: string): void {
  app.sourceText = value;
}

// ---------------------------------------------------------------------------
// 编辑器内容同步
// ---------------------------------------------------------------------------

/**
 * 标记内容已被编辑（用户输入或程序替换），同步内容并置为未保存。
 *
 * @param markdown 最新的 markdown 内容
 */
export function markEdited(markdown: string): void {
  app.content = markdown;
  app.dirty = true;
  app.saveStatus = 'Unsaved';
}

// ---------------------------------------------------------------------------
// 文件读写
// ---------------------------------------------------------------------------

/**
 * 打开文件：读取内容、更新当前文件状态并记录最近文件。
 *
 * @param path 文件绝对路径
 * @returns 文件内容字符串
 */
export async function loadFile(path: string): Promise<string> {
  const text = await ipc.readFile(path);
  app.currentFile = path;
  app.content = text;
  app.sourceText = text;
  app.dirty = false;
  app.saveStatus = 'Saved';
  const meta = await ipc.getFileMeta(path);
  app.lastSavedMtime = meta.modifiedMs;
  await addRecentFile(path);
  return text;
}

/**
 * 保存当前文件到磁盘。
 *
 * @returns 是否保存成功（未打开文件返回 false）
 */
export async function saveFile(): Promise<boolean> {
  if (!app.currentFile) return false;
  try {
    await ipc.writeFile(app.currentFile, app.content);
    app.dirty = false;
    app.saveStatus = 'Saved';
    const meta = await ipc.getFileMeta(app.currentFile);
    app.lastSavedMtime = meta.modifiedMs;
    return true;
  } catch {
    app.saveStatus = 'Save failed';
    return false;
  }
}

/**
 * 另存为到指定路径并切换当前文件。
 *
 * @param path 目标文件绝对路径
 * @returns 是否保存成功
 */
export async function saveFileAs(path: string): Promise<boolean> {
  try {
    await ipc.writeFile(path, app.content);
    app.currentFile = path;
    app.dirty = false;
    app.saveStatus = 'Saved';
    const meta = await ipc.getFileMeta(path);
    app.lastSavedMtime = meta.modifiedMs;
    await addRecentFile(path);
    return true;
  } catch {
    app.saveStatus = 'Save failed';
    return false;
  }
}
