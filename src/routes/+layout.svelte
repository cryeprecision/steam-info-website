<script lang="ts">
  import SiteHeader from '$lib/components/site-header.svelte';
  import '../app.postcss';
  import * as Tooltip from '$lib/components/ui/tooltip';
</script>

<SiteHeader />

<main class="container pt-4 px-2 mx-auto mb-52">
  <Tooltip.Provider>
    <slot />
  </Tooltip.Provider>
</main>
