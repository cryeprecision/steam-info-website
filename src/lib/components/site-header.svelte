<script lang="ts">
  import CsLogo from '$lib/components/cs-logo.svelte';
  import SteamDbLogo from '$lib/components/steam-db-logo.svelte';
  import CsStashLogo from '$lib/components/cs-stash-logo.svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import UcLogo from './uc-logo.svelte';
  import SteamLogoBlack from './steam-logo-black.svelte';
</script>

<header
  class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
  <div class="container flex h-14 max-w-screen-2xl items-center">
    <div class="flex flex-1 items-center justify-between space-x-2">
      <nav class="flex items-center gap-2">
        <Button
          href="https://www.counter-strike.net/news/updates"
          target="_blank"
          variant="outline"
        >
          <CsLogo class="h-4 mr-2" />
          Changelog
        </Button>
        <Button href="https://steamdb.info/app/730/" target="_blank" variant="outline">
          <SteamDbLogo class="h-4 fill-white mr-2" />
          SteamDB
        </Button>
        <Button href="https://csgostash.com/" target="_blank" variant="outline">
          <CsStashLogo class="h-4 grayscale mr-2 contrast-[2]" />
          CS2 Stash
        </Button>
        <Button
          href="https://www.unknowncheats.me/forum/counter-strike-2-a/"
          target="_blank"
          variant="outline"
        >
          <UcLogo class="h-4 w-5 mr-2 fill-white" />
          UnKnoWnCheaTs
        </Button>
        <Button
          href="https://steamcommunity.com/workshop/browse/?appid=730"
          target="_blank"
          variant="outline"
        >
          <SteamLogoBlack class="h-4 w-4 outline-gray-400 outline outline-2 rounded-full mr-2" />
          Workshop
        </Button>
        <Button
          href="https://steamcommunity.com/market/search?appid=730"
          target="_blank"
          variant="outline"
        >
          <SteamLogoBlack class="h-4 w-4 outline-gray-400 outline outline-2 rounded-full mr-2" />
          Marketplace
        </Button>
      </nav>
    </div>
  </div>
</header>
