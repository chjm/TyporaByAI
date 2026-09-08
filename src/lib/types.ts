/**
 * 共享类型定义。
 *
 * 与 Rust 后端序列化结构保持一致（后端使用 `#[serde(rename_all = "camelCase")]`，
 * 因此字段采用 camelCase 命名）。
 */

/** 文件树节点（对应后端 `FileNode`）。 */
export interface FileNode {
  /** 文件或目录名称 */
  name: string;
  /** 绝对路径 */
  path: string;
  /** 是否为目录 */
  isDir: boolean;
  /** 子节点（目录时） */
  children?: FileNode[];
}

/** 文件元数据（对应后端 `FileMeta`）。 */
export interface FileMeta {
  /** 最后修改时间（毫秒时间戳） */
  modifiedMs: number;
  /** 文件大小（字节） */
  size: number;
}

/** 应用配置（对应后端 `AppConfig`）。 */
export interface AppConfig {
  /** 主题标识：light / dark */
  theme: string;
  /** 最近打开的文件列表 */
  recentFiles: string[];
}

/** 大纲条目。 */
export interface OutlineItem {
  /** 标题层级（1-6） */
  level: number;
  /** 标题文本 */
  text: string;
}

/** 字数统计结果。 */
export interface WordCount {
  /** 字符数 */
  chars: number;
  /** 字数（中文字符 + 英文单词） */
  words: number;
  /** 行数 */
  lines: number;
}
