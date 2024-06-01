<script lang="ts">
  import CsLogo from '$lib/components/cs-logo.svelte';
  import SteamDbLogo from '$lib/components/steam-db-logo.svelte';
  import CsStashLogo from '$lib/components/cs-stash-logo.svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import UcLogo from './uc-logo.svelte';
  import SteamLogoBlack from './steam-logo-black.svelte';
  import GoogleTranslateLogo from './google-translate-logo.svelte';
  import DeeplLogo from './deepl-logo.svelte';
</script>

<header class="w-full p-2">
  <nav class="flex items-center justify-center flex-wrap gap-2">
    <Button href="https://www.counter-strike.net/news/updates" target="_blank" variant="outline">
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
    <Button
      href="https://translate.google.com/?sl=auto&tl=en&op=translate"
      target="_blank"
      variant="outline"
    >
      <GoogleTranslateLogo class="h-4 w-4 grayscale contrast-200 mr-2" />
      Google Translate
    </Button>
    <Button href="https://www.deepl.com/translator/l/auto/en" target="_blank" variant="outline">
      <DeeplLogo class="h-4 w-4 grayscale invert mr-2" />
      DeepL
    </Button>
  </nav>
</header>
