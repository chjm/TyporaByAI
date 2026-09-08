<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createEditor, destroyEditor, insertMarkdown } from './milkdown';
  import { app, setSourceText } from '$lib/stores/app.svelte';

  interface Props {
    /** 初始 markdown 内容 */
    initialValue?: string;
    /** 内容变化回调（用户编辑触发） */
    onChange?: (markdown: string) => void;
    /** 图片上传回调，返回用于插入的 markdown 相对路径 */
    onUploadImage?: (file: File) => Promise<string>;
    /** 图片 src 解析回调，将相对路径转换为可显示 URL */
    onResolveImageSrc?: (src: string) => string;
  }

  let { initialValue = '', onChange, onUploadImage, onResolveImageSrc }: Props = $props();

  let editorRoot: HTMLElement;

  onMount(async () => {
    await createEditor({
      root: editorRoot,
      initialValue,
      onChange,
      onUploadImage: async (file) => (onUploadImage ? await onUploadImage(file) : ''),
      resolveImageSrc: onResolveImageSrc,
    });
  });

  onDestroy(() => {
    destroyEditor();
  });

  /**
   * 拦截图片粘贴：阻止默认行为，上传图片后以 markdown 语法插入。
   *
   * @param event 剪贴板事件
   */
  async function handlePaste(event: ClipboardEvent) {
    const files = event.clipboardData?.files;
    if (!files || files.length === 0) return;
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;
    event.preventDefault();
    event.stopPropagation();
    for (const file of images) {
      if (!onUploadImage) continue;
      const url = await onUploadImage(file);
      if (url) insertMarkdown(`![${file.name}](${url})`);
    }
  }
</script>

<div class="editor-wrap" onpastecapture={handlePaste}>
  <div class="editor-root" class:hidden={app.sourceMode} bind:this={editorRoot}></div>
  {#if app.sourceMode}
    <textarea
      class="source-editor"
      value={app.sourceText}
      oninput={(e) => setSourceText(e.currentTarget.value)}
      spellcheck="false"
    ></textarea>
  {/if}
</div>

<style>
  .editor-wrap {
    position: relative;
    height: 100%;
    overflow: hidden;
  }

  .editor-root {
    height: 100%;
    overflow-y: auto;
    background: var(--editor-bg);
  }

  .editor-root.hidden {
    display: none;
  }

  .source-editor {
    width: 100%;
    height: 100%;
    border: none;
    outline: none;
    resize: none;
    padding: 40px 24px;
    font-family: var(--font-mono);
    font-size: 14px;
    line-height: 1.6;
    color: var(--text);
    background: var(--editor-bg);
  }
</style>
