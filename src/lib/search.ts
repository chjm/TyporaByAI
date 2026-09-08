/**
 * 编辑器内查找/替换辅助。
 *
 * 基于 ProseMirror 文档的可视文本进行查找，将文本偏移映射回文档位置，
 * 从而支持在所见即所得编辑器中选择、高亮与替换匹配内容。
 */

import type { EditorView } from '@milkdown/prose/view';
import type { Node as ProseNode } from '@milkdown/prose/model';
import { Plugin, PluginKey, TextSelection } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';

/** 一次匹配的范围（文档位置）。 */
export interface Match {
  /** 起始位置 */
  from: number;
  /** 结束位置 */
  to: number;
}

/**
 * 获取文档的可视文本（各文本节点拼接，无块分隔符）。
 *
 * @param doc 文档节点
 * @returns 可视文本
 */
export function getVisibleText(doc: ProseNode): string {
  return doc.textContent;
}

/**
 * 将可视文本偏移映射为文档位置。
 *
 * 遍历顺序与 `doc.textContent`（`textBetween(0, size, "")`）保持一致，
 * 除文本节点外还计入带 `leafText` 的叶子节点（如硬换行 `\n`），
 * 否则在含硬换行的文档中偏移会错位，导致高亮位置偏移。
 *
 * @param doc 文档节点
 * @param offset 可视文本偏移
 * @returns 文档位置
 */
export function textOffsetToPos(doc: ProseNode, offset: number): number {
  let current = 0;
  let result = -1;
  doc.descendants((node, pos) => {
    if (result !== -1) return false;
    let len = 0;
    if (node.isText) {
      len = node.text?.length ?? 0;
    } else if (node.isLeaf) {
      const leafText = node.type.spec.leafText?.(node);
      len = leafText ? leafText.length : 0;
    }
    if (len === 0) return true;
    if (offset >= current && offset <= current + len) {
      result = pos + (offset - current);
      return false;
    }
    current += len;
    return true;
  });
  return result === -1 ? doc.content.size : result;
}

/**
 * 查找所有匹配项。
 *
 * @param doc 文档节点
 * @param query 查询字符串
 * @param caseSensitive 是否区分大小写
 * @returns 匹配列表
 */
export function findAllMatches(doc: ProseNode, query: string, caseSensitive: boolean): Match[] {
  if (!query) return [];
  const text = getVisibleText(doc);
  const haystack = caseSensitive ? text : text.toLowerCase();
  const needle = caseSensitive ? query : query.toLowerCase();
  const matches: Match[] = [];
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    matches.push({
      from: textOffsetToPos(doc, idx),
      to: textOffsetToPos(doc, idx + needle.length),
    });
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return matches;
}

/** 查找高亮插件的 key。 */
const findHighlightKey = new PluginKey<DecorationSet>('find-highlight');

/**
 * 查找高亮插件：以背景色高亮所有匹配项与当前匹配项。
 */
export const findHighlightPlugin = new Plugin<DecorationSet>({
  key: findHighlightKey,
  state: {
    init: () => DecorationSet.empty,
    apply(tr, set) {
      const next = tr.getMeta(findHighlightKey);
      if (next) return next;
      return set.map(tr.mapping, tr.doc);
    },
  },
  props: {
    decorations(state) {
      return findHighlightKey.getState(state) ?? DecorationSet.empty;
    },
  },
});

/**
 * 选中指定匹配项、高亮所有匹配项，并滚动到可视区域。
 *
 * @param view 编辑器视图
 * @param match 当前匹配范围
 * @param allMatches 所有匹配范围
 * @param currentIndex 当前匹配索引
 */
export function selectMatch(
  view: EditorView,
  match: Match,
  allMatches: Match[],
  currentIndex: number
): void {
  const doc = view.state.doc;
  // 使用 between 而非 create：create 在匹配位于代码块等非行内内容时会抛异常。
  const sel = TextSelection.between(doc.resolve(match.from), doc.resolve(match.to));
  const decos = allMatches.flatMap((m, i) => {
    const $f = doc.resolve(m.from);
    const $t = doc.resolve(m.to);
    if ($f.parent !== $t.parent || !$f.parent.inlineContent) return [];
    return Decoration.inline(m.from, m.to, {
      class: i === currentIndex ? 'find-current' : 'find-match',
    });
  });
  view.dispatch(
    view.state.tr
      .setSelection(sel)
      .setMeta(findHighlightKey, DecorationSet.create(doc, decos))
      .scrollIntoView()
  );
}

/**
 * 清除所有查找高亮。
 *
 * @param view 编辑器视图
 */
export function clearFindHighlight(view: EditorView): void {
  view.dispatch(view.state.tr.setMeta(findHighlightKey, DecorationSet.empty));
}

/**
 * 将指定匹配项替换为文本。
 *
 * @param view 编辑器视图
 * @param match 匹配范围
 * @param replacement 替换文本
 */
export function replaceMatch(view: EditorView, match: Match, replacement: string): void {
  const tr = view.state.tr.replaceWith(match.from, match.to, view.state.schema.text(replacement));
  view.dispatch(tr);
}

/**
 * 替换全部匹配项（单次事务，从后往前替换避免位置偏移）。
 *
 * @param view 编辑器视图
 * @param query 查询字符串
 * @param replacement 替换文本
 * @param caseSensitive 是否区分大小写
 * @returns 替换数量
 */
export function replaceAll(
  view: EditorView,
  query: string,
  replacement: string,
  caseSensitive: boolean
): number {
  const all = findAllMatches(view.state.doc, query, caseSensitive);
  if (all.length === 0) return 0;
  let tr = view.state.tr;
  for (let i = all.length - 1; i >= 0; i--) {
    tr = tr.replaceWith(all[i].from, all[i].to, view.state.schema.text(replacement));
  }
  view.dispatch(tr);
  return all.length;
}
