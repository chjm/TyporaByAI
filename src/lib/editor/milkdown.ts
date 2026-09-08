/**
 * Milkdown 编辑器封装。
 *
 * 统一管理 Crepe 编辑器实例的生命周期（创建/销毁），并暴露
 * 内容读写、光标处插入、视图访问等能力，供 UI 层调用。
 */

import { Crepe } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';
import { editorViewCtx } from '@milkdown/core';
import { insert, replaceAll, $prose } from '@milkdown/utils';
import type { Editor } from '@milkdown/core';
import type { EditorView } from '@milkdown/prose/view';
import { findHighlightPlugin } from '$lib/search';

/** 编辑器创建选项。 */
export interface CreateEditorOptions {
  /** 挂载的 DOM 元素 */
  root: HTMLElement;
  /** 初始 markdown 内容 */
  initialValue?: string;
  /** 内容变化回调（用户编辑触发） */
  onChange?: (markdown: string) => void;
  /** 图片上传回调（粘贴/拖拽/工具栏上传），返回写入文档的相对路径 */
  onUploadImage?: (file: File) => Promise<string>;
  /** 图片 src 解析回调：将文档中的相对路径转换为编辑器可显示的 URL */
  resolveImageSrc?: (src: string) => string;
}

let crepe: Crepe | null = null;
let editor: Editor | null = null;
let onChangeCallback: ((markdown: string) => void) | null = null;

/**
 * 创建并挂载编辑器实例。
 *
 * @param options 创建选项
 * @throws 编辑器创建失败时抛出异常
 */
export async function createEditor(options: CreateEditorOptions): Promise<void> {
  onChangeCallback = options.onChange ?? null;
  const upload = options.onUploadImage ?? (async () => '');
  const resolveImageSrc = options.resolveImageSrc ?? ((src: string) => src);

  crepe = new Crepe({
    root: options.root,
    defaultValue: options.initialValue ?? '',
    featureConfigs: {
      [Crepe.Feature.ImageBlock]: {
        onUpload: upload,
        blockOnUpload: upload,
        proxyDomURL: resolveImageSrc,
      },
    },
  });

  crepe.on((listener) => {
    listener.markdownUpdated((_ctx, markdown) => {
      onChangeCallback?.(markdown);
    });
  });

  // 注册查找高亮插件，供查找/替换在文档上绘制匹配高亮。
  crepe.editor.use($prose(() => findHighlightPlugin));

  editor = await crepe.create();
}

/**
 * 销毁编辑器实例并释放资源。
 */
export async function destroyEditor(): Promise<void> {
  await crepe?.destroy();
  crepe = null;
  editor = null;
  onChangeCallback = null;
}

/**
 * 获取当前 markdown 内容。
 *
 * @returns markdown 字符串
 */
export function getMarkdown(): string {
  return crepe?.getMarkdown() ?? '';
}

/**
 * 整体替换编辑器内容（用于打开文件/重载，会重置编辑状态与撤销历史）。
 *
 * @param markdown 新的 markdown 内容
 */
export function setEditorContent(markdown: string): void {
  editor?.action(replaceAll(markdown, true));
}

/**
 * 在光标处插入 markdown（用于图片插入等）。
 *
 * @param markdown 要插入的 markdown 片段
 */
export function insertMarkdown(markdown: string): void {
  editor?.action(insert(markdown));
}

/**
 * 获取底层 ProseMirror 视图（用于查找/替换等高级操作）。
 *
 * @returns 编辑器视图，未创建时返回 null
 */
export function getView(): EditorView | null {
  if (!editor) return null;
  return editor.action((ctx) => ctx.get(editorViewCtx));
}
