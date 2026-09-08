<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    /** 匹配总数 */
    matchCount: number;
    /** 当前匹配索引（0 起） */
    currentIndex: number;
    onSearch: (query: string, caseSensitive: boolean) => void;
    onFindNext: () => void;
    onFindPrev: () => void;
    onReplace: (replacement: string) => void;
    onReplaceAll: (replacement: string) => void;
    onClose: () => void;
  }

  let {
    matchCount,
    currentIndex,
    onSearch,
    onFindNext,
    onFindPrev,
    onReplace,
    onReplaceAll,
    onClose,
  }: Props = $props();

  let query = $state('');
  let replacement = $state('');
  let caseSensitive = $state(false);
  let inputEl: HTMLInputElement;

  onMount(() => inputEl?.focus());

  function search() {
    onSearch(query, caseSensitive);
  }
</script>

<div class="find-replace">
  <div class="row">
    <input
      class="field"
      bind:this={inputEl}
      bind:value={query}
      placeholder="查找"
      onkeydown={(e) => {
        if (e.key === 'Enter') search();
        if (e.key === 'Escape') onClose();
      }}
    />
    <span class="count">{query ? (matchCount > 0 ? `${currentIndex + 1}/${matchCount}` : '无结果') : ''}</span>
    <button class="btn" title="上一个" onclick={onFindPrev}>↑</button>
    <button class="btn" title="下一个" onclick={onFindNext}>↓</button>
  </div>

  <div class="row">
    <input
      class="field"
      bind:value={replacement}
      placeholder="替换为"
      onkeydown={(e) => {
        if (e.key === 'Enter') onReplace(replacement);
      }}
    />
    <button class="btn text" onclick={() => onReplace(replacement)}>替换</button>
    <button class="btn text" onclick={() => onReplaceAll(replacement)}>全部替换</button>
  </div>

  <div class="row options">
    <label class="case">
      <input type="checkbox" bind:checked={caseSensitive} />
      区分大小写
    </label>
    <button class="btn text" onclick={onClose}>关闭</button>
  </div>
</div>

<style>
  .find-replace {
    position: absolute;
    top: 8px;
    right: 12px;
    z-index: 100;
    width: 320px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--panel-bg);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .field {
    flex: 1;
    min-width: 0;
    height: 28px;
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0 8px;
    font-size: 13px;
    color: var(--text);
    background: var(--bg);
    outline: none;
  }

  .field:focus {
    border-color: var(--accent);
  }

  .count {
    min-width: 44px;
    text-align: center;
    font-size: 12px;
    color: var(--text-secondary);
  }

  .btn {
    height: 28px;
    padding: 0 8px;
    border-radius: 4px;
    font-size: 13px;
    color: var(--text);
  }

  .btn:hover {
    background: var(--hover-bg);
  }

  .btn.text {
    border: 1px solid var(--border);
  }

  .options {
    justify-content: space-between;
  }

  .case {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--text-secondary);
  }
</style>
