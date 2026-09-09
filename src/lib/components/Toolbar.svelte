<script lang="ts">
  import { app } from '$lib/stores/app.svelte';

  interface Props {
    onOpenFolder: () => void;
    onOpenFile: () => void;
    onNewFile: () => void;
    onSave: () => void;
    onSetMode: (source: boolean) => void;
    onToggleTheme: () => void;
    onToggleFindReplace: () => void;
    onToggleSidebar: () => void;
    onToggleOutline: () => void;
  }

  let {
    onOpenFolder,
    onOpenFile,
    onNewFile,
    onSave,
    onSetMode,
    onToggleTheme,
    onToggleFindReplace,
    onToggleSidebar,
    onToggleOutline,
  }: Props = $props();
</script>

<div class="toolbar">
  <div class="group">
    <button class="btn" title="Open Folder" onclick={onOpenFolder}>
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
    </button>
    <button class="btn" title="Open File" onclick={onOpenFile}>
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M6 2h9l5 5v13c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm8 1.5V8h4.5L14 3.5z"/></svg>
    </button>
    <button class="btn" title="New File" onclick={onNewFile}>
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M13 3h-2v8H3v2h8v8h2v-8h8v-2h-8V3z"/></svg>
    </button>
    <button class="btn" title="Save" onclick={onSave} disabled={!app.currentFile}>
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M17 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
    </button>
  </div>

  <div class="center">
    <div class="segmented" title="Mode">
      <button class="seg" class:active={!app.sourceMode} onclick={() => onSetMode(false)}>Preview</button>
      <button class="seg" class:active={app.sourceMode} onclick={() => onSetMode(true)}>Source</button>
    </div>
  </div>

  <div class="group right">
    <button class="btn" class:active={app.showFindReplace} title="Find & Replace" onclick={onToggleFindReplace}>
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"/></svg>
    </button>
    <button class="btn" title="Toggle Theme" onclick={onToggleTheme}>
      {#if app.theme === 'light'}
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26 5.4 5.4 0 0 1-5.4-5.4c0-1.81.9-3.42 2.26-4.4A9 9 0 0 0 12 3z"/></svg>
      {:else}
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 18a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1zM5.64 5.64a1 1 0 0 1 1.42 0l1.41 1.41a1 1 0 1 1-1.42 1.42L5.64 7.06a1 1 0 0 1 0-1.42zm11.3 11.3a1 1 0 0 1 1.42 0l1.41 1.41a1 1 0 1 1-1.42 1.42l-1.41-1.42a1 1 0 0 1 0-1.41zM2 12a1 1 0 0 1 1-1h2a1 1 0 0 1 0 2H3a1 1 0 0 1-1-1zm16 0a1 1 0 0 1 1-1h2a1 1 0 0 1 0 2h-2a1 1 0 0 1-1-1zM5.64 18.36a1 1 0 0 1 0-1.42l1.41-1.41a1 1 0 1 1 1.42 1.42L7.06 18.36a1 1 0 0 1-1.42 0zm11.3-11.3a1 1 0 0 1 0-1.42l1.41-1.41a1 1 0 1 1 1.42 1.42l-1.41 1.41a1 1 0 0 1-1.42 0z"/></svg>
      {/if}
    </button>
    <button class="btn" class:active={app.showSidebar} title="File Tree" onclick={onToggleSidebar}>
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3 5h8v14H3V5zm10 0h8v4h-8V5zm0 6h8v4h-8v-4zm0 6h8v2h-8v-2z"/></svg>
    </button>
    <button class="btn" class:active={app.showOutline} title="Outline" onclick={onToggleOutline}>
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z"/></svg>
    </button>
  </div>
</div>

<style>
  .toolbar {
    position: relative;
    display: flex;
    align-items: center;
    height: var(--toolbar-height);
    padding: 0 8px;
    background: var(--panel-bg);
    border-bottom: 1px solid var(--border);
    gap: 4px;
  }

  .group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .group.right {
    margin-left: auto;
  }

  .center {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
  }

  .segmented {
    display: flex;
    align-items: center;
    height: 26px;
    padding: 2px;
    border-radius: 5px;
    background: var(--hover-bg);
  }

  .seg {
    height: 22px;
    padding: 0 12px;
    border-radius: 3px;
    font-size: 12px;
    color: var(--text-secondary);
  }

  .seg:hover {
    color: var(--text);
  }

  .seg.active {
    background: var(--bg);
    color: var(--accent);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 4px;
    color: var(--text);
  }

  .btn:hover {
    background: var(--hover-bg);
  }

  .btn.active {
    background: var(--active-bg);
    color: var(--accent);
  }

  .btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .btn:disabled:hover {
    background: none;
  }
</style>
