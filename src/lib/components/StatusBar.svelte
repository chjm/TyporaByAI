<script lang="ts">
  import type { WordCount } from '$lib/types';
  import { app } from '$lib/stores/app.svelte';

  interface Props {
    wordCount: WordCount;
  }

  let { wordCount }: Props = $props();

  let fileName = $derived(app.currentFile ? app.currentFile.split(/[\\/]/).pop() ?? '' : 'No file open');
</script>

<footer class="statusbar">
  <span class="left">
    <span class="file">{fileName}</span>
    {#if app.dirty}
      <span class="dot" title="Unsaved"></span>
    {/if}
    <span class="status">{app.saveStatus}</span>
  </span>

  <span class="right">
    {#if app.sourceMode}
      <span class="tag">Source</span>
    {/if}
    <span>{wordCount.words} words</span>
    <span>{wordCount.chars} characters</span>
    <span>{wordCount.lines} lines</span>
  </span>
</footer>

<style>
  .statusbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--statusbar-height);
    padding: 0 12px;
    font-size: 12px;
    color: var(--text-secondary);
    background: var(--panel-bg);
    border-top: 1px solid var(--border);
  }

  .left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .file {
    color: var(--text);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
  }

  .tag {
    padding: 0 6px;
    border-radius: 3px;
    background: var(--active-bg);
    color: var(--text);
  }
</style>
