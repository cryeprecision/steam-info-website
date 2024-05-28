<script lang="ts">
  import SiteHeader from '$lib/components/site-header.svelte';
  import '../app.postcss';
  import { ModeWatcher } from 'mode-watcher';
</script>

<ModeWatcher defaultMode="dark" />
<SiteHeader />
<main class="container pt-4 px-2 mx-auto mb-52">
  <slot />
</main>
