/**
 * 通用工具函数集合：防抖、路径处理、base64 编码、大纲解析、字数统计。
 */

import type { OutlineItem, WordCount } from './types';

/**
 * 创建防抖函数。
 *
 * @param fn 需要防抖的函数
 * @param delay 延迟毫秒数
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * 获取路径的目录部分（兼容 `/` 与 `\` 分隔符）。
 *
 * @param path 文件或目录路径
 * @returns 目录路径
 */
export function dirname(path: string): string {
  const i = Math.max(path.lastIndexOf('\\'), path.lastIndexOf('/'));
  return i === -1 ? '' : path.slice(0, i);
}

/**
 * 获取文件扩展名（不含点，小写）。
 *
 * @param name 文件名
 * @returns 扩展名，无扩展名时返回空字符串
 */
export function getExt(name: string): string {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i + 1).toLowerCase();
}

/**
 * 将字节数组编码为 base64 字符串。
 *
 * @param bytes 字节数组
 * @returns base64 字符串
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * 从 markdown 文本解析大纲（标题列表），忽略代码块内的 `#`。
 *
 * @param markdown markdown 文本
 * @returns 大纲条目列表
 */
export function buildOutline(markdown: string): OutlineItem[] {
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, '');
  const items: OutlineItem[] = [];
  for (const line of withoutCode.split('\n')) {
    const m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) {
      items.push({ level: m[1].length, text: m[2].trim() });
    }
  }
  return items;
}

/**
 * 统计字符数、字数与行数。
 *
 * @param markdown markdown 文本
 * @returns 字数统计结果
 */
export function countWords(markdown: string): WordCount {
  const chars = markdown.length;
  const lines = markdown === '' ? 0 : markdown.split('\n').length;
  const cjk = (markdown.match(/[一-鿿぀-ヿ가-힯]/g) || []).length;
  const latin = (markdown.match(/[a-zA-Z0-9_]+/g) || []).length;
  return { chars, words: cjk + latin, lines };
}

/**
 * 生成不重复的文件名（用于新建文件）。
 *
 * @param base 基础名（如 `未命名`）
 * @param ext 扩展名（如 `md`）
 * @param exists 存在性检查函数
 * @returns 唯一文件名
 */
export function uniqueName(base: string, ext: string, exists: (name: string) => boolean): string {
  let name = `${base}.${ext}`;
  let i = 1;
  while (exists(name)) {
    name = `${base}-${i}.${ext}`;
    i += 1;
  }
  return name;
}
