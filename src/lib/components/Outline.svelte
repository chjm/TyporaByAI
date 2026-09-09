<script lang="ts">
  import type { OutlineItem } from '$lib/types';

  interface Props {
    items: OutlineItem[];
    activeIndex: number;
    onJump: (index: number) => void;
  }

  let { items, activeIndex, onJump }: Props = $props();
</script>

<div class="outline">
  {#if items.length === 0}
    <p class="empty">No headings</p>
  {:else}
    <ul>
      {#each items as item, i (i)}
        <li>
          <button
            class="item"
            class:active={i === activeIndex}
            style="padding-left: {8 + (item.level - 1) * 14}px"
            onclick={() => onJump(i)}
          >
            {item.text}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .outline {
    padding: 8px 0;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .item {
    display: block;
    width: 100%;
    text-align: left;
    padding: 3px 12px;
    color: var(--text);
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-left: 2px solid transparent;
  }

  .item:hover {
    background: var(--hover-bg);
  }

  .item.active {
    color: var(--accent);
    border-left-color: var(--accent);
  }

  .empty {
    padding: 8px 12px;
    color: var(--text-secondary);
    font-size: 13px;
  }
</style>
