<script lang="ts">
  import type { FileNode } from '$lib/types';
  import { app, toggleExpand, renameEntry, deleteEntry } from '$lib/stores/app.svelte';
  import FileTree from './FileTree.svelte';

  interface Props {
    nodes: FileNode[];
    level?: number;
    onOpenFile: (path: string) => void;
  }

  let { nodes, level = 0, onOpenFile }: Props = $props();

  let renamingPath = $state('');
  let renameValue = $state('');

  function isExpanded(path: string): boolean {
    return !!app.expandedPaths[path];
  }

  async function handleToggle(node: FileNode) {
    if (node.isDir) await toggleExpand(node.path);
  }

  function children(node: FileNode): FileNode[] {
    return app.childrenByPath[node.path] ?? node.children ?? [];
  }

  function startRename(node: FileNode) {
    renamingPath = node.path;
    renameValue = node.name;
  }

  async function commitRename() {
    const path = renamingPath;
    const name = renameValue.trim();
    renamingPath = '';
    if (path && name) await renameEntry(path, name);
  }

  function cancelRename() {
    renamingPath = '';
  }

  async function handleDelete(node: FileNode) {
    if (window.confirm(`Delete "${node.name}"?`)) {
      await deleteEntry(node.path);
    }
  }
</script>

<ul class="tree" style="padding-left: {level === 0 ? '0' : '0.9em'}">
  {#each nodes as node (node.path)}
    <li>
      <div class="row" class:active={app.currentFile === node.path}>
        {#if node.isDir}
          <button class="toggle" onclick={() => handleToggle(node)}>
            {isExpanded(node.path) ? '▾' : '▸'}
          </button>
        {:else}
          <span class="toggle spacer"></span>
        {/if}

        {#if renamingPath === node.path}
          <input
            class="rename-input"
            bind:value={renameValue}
            onkeydown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') cancelRename();
            }}
            onblur={commitRename}
          />
        {:else}
          <button
            class="name"
            title={node.path}
            onclick={() => (node.isDir ? handleToggle(node) : onOpenFile(node.path))}
          >
            <span class="icon">
              {#if node.isDir}
                <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
              {:else}
                <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M6 2h9l5 5v13c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm8 1.5V8h4.5L14 3.5z"/></svg>
              {/if}
            </span>
            {node.name}
          </button>
        {/if}

        <span class="actions">
          <button class="action" title="Rename" onclick={() => startRename(node)}>
            <svg viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          <button class="action danger" title="Delete" onclick={() => handleDelete(node)}>
            <svg viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </span>
      </div>

      {#if node.isDir && isExpanded(node.path)}
        <FileTree nodes={children(node)} level={level + 1} {onOpenFile} />
      {/if}
    </li>
  {/each}
</ul>

<style>
  .tree {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .row {
    display: flex;
    align-items: center;
    height: 26px;
    padding-right: 4px;
    border-radius: 4px;
    cursor: pointer;
  }

  .row:hover {
    background: var(--hover-bg);
  }

  .row.active {
    background: var(--active-bg);
  }

  .toggle {
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .toggle.spacer {
    visibility: hidden;
  }

  .name {
    display: flex;
    align-items: center;
    gap: 5px;
    flex: 1;
    min-width: 0;
    height: 100%;
    text-align: left;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .icon {
    display: inline-flex;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .actions {
    display: none;
    gap: 1px;
    flex-shrink: 0;
  }

  .row:hover .actions {
    display: inline-flex;
  }

  .action {
    width: 20px;
    height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    color: var(--text-secondary);
  }

  .action:hover {
    background: var(--active-bg);
    color: var(--text);
  }

  .action.danger:hover {
    color: #d64545;
  }

  .rename-input {
    flex: 1;
    min-width: 0;
    height: 22px;
    border: 1px solid var(--accent);
    border-radius: 3px;
    padding: 0 4px;
    font-size: 13px;
    color: var(--text);
    background: var(--bg);
    outline: none;
  }
</style>
