<script>
  import { page } from '$app/stores';
  import AlertDescription from '$lib/components/ui/alert/alert-description.svelte';
  import AlertTitle from '$lib/components/ui/alert/alert-title.svelte';
  import Alert from '$lib/components/ui/alert/alert.svelte';
  import { TriangleAlert } from 'lucide-svelte';
  $: ({ error, status } = $page);
</script>

<svelte:head>
  <title>You done fucked up!</title>
</svelte:head>

<Alert variant="destructive" class="max-w-xl mx-auto">
  <TriangleAlert class="h-5 w-5" />
  <AlertTitle>
    Error {status}
  </AlertTitle>
  {#if error}
    <AlertDescription>
      {error.message}
    </AlertDescription>
  {/if}
</Alert>
