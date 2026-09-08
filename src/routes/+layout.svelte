<script lang="ts">
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import { loadConfig } from '$lib/stores/app.svelte';
  import '$lib/styles/app.css';
  import '$lib/styles/dark.css';

  let { children }: { children: Snippet } = $props();

  onMount(() => {
    loadConfig();
  });
</script>

{@render children()}
