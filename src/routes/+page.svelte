<script lang="ts">
  import { onMount } from 'svelte';
  import { open, save } from '@tauri-apps/plugin-dialog';
  import * as store from '$lib/stores/app.svelte';
  import * as ipc from '$lib/ipc';
  import { buildOutline, countWords, dirname, getExt, bytesToBase64, debounce } from '$lib/utils';
  import { getMarkdown, setEditorContent, getView } from '$lib/editor/milkdown';
  import {
    findAllMatches,
    selectMatch,
    clearFindHighlight,
    replaceMatch,
    replaceAll,
    type Match,
  } from '$lib/search';
  import { convertFileSrc } from '@tauri-apps/api/core';
  import Toolbar from '$lib/components/Toolbar.svelte';
  import FileTree from '$lib/components/FileTree.svelte';
  import Outline from '$lib/components/Outline.svelte';
  import StatusBar from '$lib/components/StatusBar.svelte';
  import FindReplace from '$lib/components/FindReplace.svelte';
  import Editor from '$lib/editor/Editor.svelte';

  const outline = $derived(buildOutline(store.app.content));
  const wordCount = $derived(countWords(store.app.content));

  // 查找替换状态
  let findQuery = $state('');
  let findCaseSensitive = $state(false);
  let findMatches = $state<Match[]>([]);
  let findIndex = $state(0);

  // -------------------------------------------------------------------------
  // 自动保存
  // -------------------------------------------------------------------------
  const scheduleAutoSave = debounce(async () => {
    if (!store.app.currentFile || store.app.sourceMode) return;
    await store.saveFile();
  }, 800);

  // -------------------------------------------------------------------------
  // 编辑器内容同步
  // -------------------------------------------------------------------------
  function handleEditorChange(markdown: string) {
    store.markEdited(markdown);
    scheduleAutoSave();
  }

  // -------------------------------------------------------------------------
  // 文件打开 / 保存
  // -------------------------------------------------------------------------
  async function openFolder() {
    const dir = await open({ directory: true });
    if (!dir || Array.isArray(dir)) return;
    await store.openFolder(dir);
  }

  async function openFileDialog() {
    const path = await open({
      multiple: false,
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd', 'txt'] }],
    });
    if (!path || Array.isArray(path)) return;
    await loadFile(path);
  }

  async function loadFile(path: string) {
    const text = await store.loadFile(path);
    setEditorContent(text);
  }

  async function newFile() {
    if (!store.app.rootPath) {
      await openFolder();
      if (!store.app.rootPath) return;
    }
    await store.createEntry(store.app.rootPath, false, '未命名');
  }

  async function newFolder() {
    if (!store.app.rootPath) {
      await openFolder();
      if (!store.app.rootPath) return;
    }
    await store.createEntry(store.app.rootPath, true, '新建文件夹');
  }

  async function saveCurrentFile() {
    if (!store.app.currentFile) {
      await saveAs();
      return;
    }
    await store.saveFile();
  }

  async function saveAs() {
    const path = await save({
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    });
    if (!path) return;
    let finalPath = path;
    if (!/\.(md|markdown|txt)$/i.test(finalPath)) finalPath += '.md';
    await store.saveFileAs(finalPath);
  }

  // -------------------------------------------------------------------------
  // 源码模式 / 主题
  // -------------------------------------------------------------------------
  function setMode(source: boolean) {
    if (store.app.sourceMode === source) return;
    if (source) {
      store.setSourceText(getMarkdown());
      store.setSourceMode(true);
    } else {
      store.setSourceMode(false);
      setEditorContent(store.app.sourceText);
      handleEditorChange(store.app.sourceText);
    }
  }

  async function toggleTheme() {
    await store.setTheme(store.app.theme === 'light' ? 'dark' : 'light');
  }

  // -------------------------------------------------------------------------
  // 外部修改检测
  // -------------------------------------------------------------------------
  async function checkExternalChange() {
    if (!store.app.currentFile || store.app.dirty || store.app.lastSavedMtime === 0) return;
    try {
      const meta = await ipc.getFileMeta(store.app.currentFile);
      if (meta.modifiedMs !== store.app.lastSavedMtime) {
        if (window.confirm('文件已在外部被修改，是否重新加载？')) {
          await loadFile(store.app.currentFile);
        }
      }
    } catch {
      /* 文件可能已不存在，忽略 */
    }
  }

  // -------------------------------------------------------------------------
  // 大纲跳转
  // -------------------------------------------------------------------------
  function jumpToHeading(index: number) {
    const root = document.querySelector('.editor-root');
    if (!root) return;
    root.querySelectorAll('h1,h2,h3,h4,h5,h6')[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  // -------------------------------------------------------------------------
  // 图片上传
  // -------------------------------------------------------------------------
  async function handleImageUpload(file: File): Promise<string> {
    const dir = store.app.currentFile ? dirname(store.app.currentFile) : store.app.rootPath;
    if (!dir) return '';
    const assetsDir = dir + '\\assets';
    const ext = getExt(file.name) || 'png';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    await ipc.saveImage(assetsDir, name, bytesToBase64(bytes));
    return `./assets/${name}`;
  }

  /** 将文档中的图片相对路径解析为编辑器可加载的本地资源 URL。 */
  function resolveImageSrc(src: string): string {
    if (/^(https?:|data:|blob:|asset:|file:)/i.test(src)) return src;
    const dir = store.app.currentFile ? dirname(store.app.currentFile) : store.app.rootPath;
    if (!dir) return src;
    const rel = src.replace(/^\.\//, '').replace(/\//g, '\\');
    return convertFileSrc(dir + '\\' + rel);
  }

  // -------------------------------------------------------------------------
  // 查找替换
  // -------------------------------------------------------------------------
  function doSearch(query: string, caseSensitive: boolean) {
    const view = getView();
    if (!view) return;
    findQuery = query;
    findCaseSensitive = caseSensitive;
    findMatches = findAllMatches(view.state.doc, query, caseSensitive);
    findIndex = 0;
    if (findMatches.length > 0) selectMatch(view, findMatches[0], findMatches, 0);
  }

  function findNext() {
    const view = getView();
    if (!view || findMatches.length === 0) return;
    findIndex = (findIndex + 1) % findMatches.length;
    selectMatch(view, findMatches[findIndex], findMatches, findIndex);
  }

  function findPrev() {
    const view = getView();
    if (!view || findMatches.length === 0) return;
    findIndex = (findIndex - 1 + findMatches.length) % findMatches.length;
    selectMatch(view, findMatches[findIndex], findMatches, findIndex);
  }

  /** 切换查找面板：关闭时清除高亮并重置匹配状态。 */
  function toggleFindPanel() {
    if (store.app.showFindReplace) {
      const view = getView();
      if (view) clearFindHighlight(view);
      findMatches = [];
      findIndex = 0;
      findQuery = '';
    }
    store.toggleFindReplace();
  }

  function replaceCurrent(replacement: string) {
    const view = getView();
    if (!view || findMatches.length === 0) return;
    replaceMatch(view, findMatches[findIndex], replacement);
    store.markEdited(getMarkdown());
    scheduleAutoSave();
    doSearch(findQuery, findCaseSensitive);
  }

  function replaceAllMatches(replacement: string) {
    const view = getView();
    if (!view) return;
    replaceAll(view, findQuery, replacement, findCaseSensitive);
    findMatches = [];
    findIndex = 0;
    store.markEdited(getMarkdown());
    scheduleAutoSave();
  }

  // -------------------------------------------------------------------------
  // 快捷键
  // -------------------------------------------------------------------------
  function onKeydown(e: KeyboardEvent) {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveCurrentFile();
    } else if (mod && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      if (!store.app.showFindReplace) store.toggleFindReplace();
    } else if (mod && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      openFileDialog();
    } else if (mod && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      newFile();
    } else if (e.key === 'Escape' && store.app.showFindReplace) {
      toggleFindPanel();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', onKeydown);
    window.addEventListener('focus', checkExternalChange);
    return () => {
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener('focus', checkExternalChange);
    };
  });
</script>

<div class="app">
  <Toolbar
    onOpenFolder={openFolder}
    onOpenFile={openFileDialog}
    onNewFile={newFile}
    onSave={saveCurrentFile}
    onSetMode={setMode}
    onToggleTheme={toggleTheme}
    onToggleFindReplace={toggleFindPanel}
    onToggleSidebar={store.toggleSidebar}
    onToggleOutline={store.toggleOutline}
  />

  <div class="main">
    {#if store.app.showSidebar}
      <aside class="sidebar">
        <div class="sidebar-title">
          <span>文件</span>
          <span class="sidebar-actions">
            <button class="mini" title="新建文件" onclick={newFile}>文件</button>
            <button class="mini" title="新建文件夹" onclick={newFolder}>文件夹</button>
          </span>
        </div>
        <div class="sidebar-body">
          {#if store.app.rootPath}
            <FileTree nodes={store.app.fileTree} onOpenFile={loadFile} />
          {:else}
            <p class="hint">尚未打开文件夹</p>
          {/if}
        </div>
      </aside>
    {/if}

    <main class="editor-area">
      <Editor
        initialValue={store.app.content}
        onChange={handleEditorChange}
        onUploadImage={handleImageUpload}
        onResolveImageSrc={resolveImageSrc}
      />

      {#if store.app.showFindReplace}
        <FindReplace
          matchCount={findMatches.length}
          currentIndex={findIndex}
          onSearch={doSearch}
          onFindNext={findNext}
          onFindPrev={findPrev}
          onReplace={replaceCurrent}
          onReplaceAll={replaceAllMatches}
          onClose={toggleFindPanel}
        />
      {/if}
    </main>

    {#if store.app.showOutline}
      <aside class="outline">
        <div class="sidebar-title"><span>大纲</span></div>
        <div class="sidebar-body">
          <Outline items={outline} activeIndex={-1} onJump={jumpToHeading} />
        </div>
      </aside>
    {/if}
  </div>

  <StatusBar {wordCount} />
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg);
  }

  .main {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .sidebar,
  .outline {
    width: var(--sidebar-width);
    min-width: var(--sidebar-width);
    display: flex;
    flex-direction: column;
    background: var(--sidebar-bg);
    border-right: 1px solid var(--border);
  }

  .outline {
    border-right: none;
    border-left: 1px solid var(--border);
  }

  .sidebar-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding: 0 10px;
    font-size: 12px;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border);
  }

  .sidebar-actions {
    display: flex;
    gap: 4px;
  }

  .mini {
    height: 20px;
    padding: 0 6px;
    font-size: 11px;
    border: 1px solid var(--border);
    border-radius: 3px;
    color: var(--text);
  }

  .mini:hover {
    background: var(--hover-bg);
  }

  .sidebar-body {
    flex: 1;
    overflow-y: auto;
    padding: 6px;
  }

  .hint {
    padding: 8px;
    color: var(--text-secondary);
    font-size: 13px;
  }

  .editor-area {
    position: relative;
    flex: 1;
    min-width: 0;
    height: 100%;
  }
</style>
