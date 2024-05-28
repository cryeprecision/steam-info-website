<script lang="ts">
  import type { PageData } from './$types';
  import ProfileInfo from '$lib/components/profile-info.svelte';
  import { ChevronLeft, ChevronRight, Search } from 'lucide-svelte';
  import type { z } from 'zod';
  import { banSchema, summarySchema, type FriendsData } from '$lib/schemas';
  import Input from '$lib/components/ui/input/input.svelte';
  import Fuse from 'fuse.js';
  import Pagination from '$lib/components/ui/pagination/pagination.svelte';
  import PaginationContent from '$lib/components/ui/pagination/pagination-content.svelte';
  import PaginationItem from '$lib/components/ui/pagination/pagination-item.svelte';
  import PaginationPrevButton from '$lib/components/ui/pagination/pagination-prev-button.svelte';
  import PaginationEllipsis from '$lib/components/ui/pagination/pagination-ellipsis.svelte';
  import PaginationLink from '$lib/components/ui/pagination/pagination-link.svelte';
  import PaginationNextButton from '$lib/components/ui/pagination/pagination-next-button.svelte';
  import { writable } from 'svelte/store';
  import Card from '$lib/components/ui/card/card.svelte';
  import CardHeader from '$lib/components/ui/card/card-header.svelte';
  import CardTitle from '$lib/components/ui/card/card-title.svelte';
  import CardContent from '$lib/components/ui/card/card-content.svelte';
  import { Select, SelectValue } from '$lib/components/ui/select';
  import SelectTrigger from '$lib/components/ui/select/select-trigger.svelte';
  import SelectContent from '$lib/components/ui/select/select-content.svelte';
  import SelectItem from '$lib/components/ui/select/select-item.svelte';
  import type { Selected } from 'bits-ui';

  type ProcessedData = {
    profileData: {
      bans: z.infer<typeof banSchema>;
      summary: z.infer<typeof summarySchema>;
    };
    friendsData: FriendsData[] | null;
    filteredFriendsData: FriendsData[] | null;
    requestsUsed: number;
  };

  type SortValue =
    | 'days_since_last_ban'
    | 'community_banned'
    | 'number_of_vac_bans'
    | 'number_of_game_bans'
    | 'friends_since'
    | 'steam_id';
  const sortValues: [SortValue, string][] = [
    ['days_since_last_ban', 'Days Since Last Ban'],
    ['community_banned', 'Community Banned'],
    ['number_of_vac_bans', 'Number of VAC Bans'],
    ['number_of_game_bans', 'Number of Game Bans'],
    ['friends_since', 'Friends Since'],
    ['steam_id', 'Steam ID']
  ];

  type SortDirection = 'ascending' | 'descending';
  const sortDirections: [SortDirection, string][] = [
    ['ascending', 'Ascending'],
    ['descending', 'Descending']
  ];

  type SortOptions = {
    value: SortValue;
    direction: SortDirection;
  };

  function sortFriendsData(
    sortOptions: SortOptions
  ): (lhs: FriendsData, rhs: FriendsData) => number {
    return (lhs: FriendsData, rhs: FriendsData): number => {
      const { direction, value } = sortOptions;

      if (direction === 'ascending') {
        [lhs, rhs] = [rhs, lhs];
      }

      if (value === 'days_since_last_ban') {
        const lhsBanned = lhs.bans.number_of_game_bans !== 0 || lhs.bans.number_of_vac_bans !== 0;
        const rhsBanned = rhs.bans.number_of_game_bans !== 0 || rhs.bans.number_of_vac_bans !== 0;

        if (lhsBanned !== rhsBanned) {
          return rhsBanned ? -1 : 1;
        }
        if (lhs.bans.days_since_last_ban !== rhs.bans.days_since_last_ban) {
          return rhs.bans.days_since_last_ban - lhs.bans.days_since_last_ban;
        }
      }
      if (value === 'community_banned' && lhs.bans.community_banned !== rhs.bans.community_banned) {
        return rhs.bans.community_banned ? 1 : -1;
      }
      if (
        value === 'number_of_vac_bans' &&
        lhs.bans.number_of_vac_bans !== rhs.bans.number_of_vac_bans
      ) {
        return rhs.bans.number_of_vac_bans - lhs.bans.number_of_vac_bans;
      }
      if (
        value === 'number_of_game_bans' &&
        lhs.bans.number_of_game_bans !== rhs.bans.number_of_game_bans
      ) {
        return rhs.bans.number_of_game_bans - lhs.bans.number_of_game_bans;
      }
      if (
        value === 'friends_since' &&
        lhs.friendInfo.friends_since !== rhs.friendInfo.friends_since
      ) {
        return rhs.friendInfo.friends_since.getTime() - lhs.friendInfo.friends_since.getTime();
      }

      return Number(BigInt(rhs.summary.steam_id) - BigInt(lhs.summary.steam_id));
    };
  }
  function processData(
    data: PageData['data'],
    filter: string,
    sortOptions: SortOptions
  ): ProcessedData {
    const { steam_id, friends, bans, summaries } = data;
    const profileData = { bans: bans[steam_id], summary: summaries[steam_id] };

    const [friendsData, filteredFriendsData] = (() => {
      if (friends === null) {
        return [null, null];
      }
      const friendsData = Object.entries(friends).map(([steamId, friendInfo]) => {
        return { bans: bans[steamId], summary: summaries[steamId], friendInfo };
      });
      friendsData.sort(sortFriendsData(sortOptions));

      const filteredFriendsData = (() => {
        if (filter === '') {
          return friendsData;
        }
        const exactMatches = friendsData.filter(
          ({ summary: { steam_id, persona_name, real_name } }) =>
            steam_id === filter || persona_name === filter || real_name === filter
        );
        if (exactMatches.length !== 0) {
          return exactMatches;
        }

        const fuse = new Fuse(friendsData, {
          keys: ['summary.steam_id', 'summary.persona_name', 'summary.real_name'],
          shouldSort: false,
          threshold: 0.4
        });
        return fuse.search(filter).map(({ item }) => item);
      })();

      return [friendsData, filteredFriendsData];
    })();

    const batchRequests = Math.ceil(((friendsData?.length ?? 0) + 1) / 100);
    const requestsUsed =
      1 + // resolve the vanity url
      1 + // get the friends list
      batchRequests + // get the ban info for each profile
      batchRequests; // get the player summary for each profile

    return { profileData, friendsData, filteredFriendsData, requestsUsed };
  }

  export let data: PageData;

  let filter = writable('');
  let sortDirection = writable<Selected<SortDirection>>({
    value: sortDirections[0][0],
    label: sortDirections[0][1]
  });
  let sortValue = writable<Selected<SortValue>>({
    value: sortValues[0][0],
    label: sortValues[0][1]
  });

  const setSortDirection = (val: Selected<unknown> | undefined) => {
    if (val !== undefined) {
      $sortDirection = val as Selected<SortDirection>;
    }
  };
  const setSortValue = (val: Selected<unknown> | undefined) => {
    if (val !== undefined) {
      $sortValue = val as Selected<SortValue>;
    }
  };

  $: ({ data: innerData } = data);
  $: ({ friendsData, profileData, requestsUsed, filteredFriendsData } = processData(
    innerData,
    $filter,
    { direction: $sortDirection.value, value: $sortValue.value }
  ));

  const perPage = 12;
  const siblingCount = 2;
  let currentPage = writable(1);
  $: count = filteredFriendsData?.length ?? 0;
  $: maxPages = Math.max(1, Math.ceil(count / perPage));
  $: {
    $currentPage = Math.min(maxPages, $currentPage);
  }
  $: itemsOnCurrentPage =
    filteredFriendsData?.slice(($currentPage - 1) * perPage, $currentPage * perPage) ?? [];
</script>

<svelte:head>
  <title>
    {profileData.summary.persona_name}
  </title>
</svelte:head>

<div class="grid grid-cols-1 xl:grid-cols-3 md:grid-cols-2 gap-2">
  <div class="col-span-1 xl:col-span-3 md:col-span-2">
    <Card>
      <CardHeader>
        <CardTitle>Metadata</CardTitle>
      </CardHeader>
      <CardContent>
        Loading this page used <b>{requestsUsed}</b> requests to the Steam API and took
        <b>{data.elapsedMs.toFixed(1)}ms</b>
      </CardContent>
    </Card>
  </div>
  <ProfileInfo
    profileInfo={profileData.summary}
    banInfo={profileData.bans}
    friendInfos={{ type: 'main', data: friendsData }}
    class="col-span-1 xl:col-span-3 md:col-span-2"
  />
  <div class="col-span-1 xl:col-span-3 md:col-span-2 relative">
    <div class="grid md:grid-cols-3 gap-2">
      <div class="md:col-span-2">
        <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input bind:value={$filter} placeholder="Search..." class="pl-9" />
      </div>
      <div class="grid md:grid-cols-2 gap-2">
        <Select onSelectedChange={setSortDirection} selected={$sortDirection}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {#each sortDirections as [value, label]}
              <SelectItem {value}>{label}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
        <Select onSelectedChange={setSortValue} selected={$sortValue}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {#each sortValues as [value, label]}
              <SelectItem {value}>{label}</SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
  <div class="col-span-1 xl:col-span-3 md:col-span-2">
    <Pagination
      count={Math.max(1, count)}
      {perPage}
      {siblingCount}
      page={$currentPage}
      let:pages
      onPageChange={(page) => {
        $currentPage = Math.min(page, maxPages);
      }}
    >
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevButton>
            <ChevronLeft class="w-4 h-4" />
            <span>Previous</span>
          </PaginationPrevButton>
        </PaginationItem>
        {#each pages as page (page.key)}
          {#if page.type === 'ellipsis'}
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          {:else}
            <PaginationItem>
              <PaginationLink {page} isActive={$currentPage === page.value}>
                {page.value}
              </PaginationLink>
            </PaginationItem>
          {/if}
        {/each}
        <PaginationItem>
          <PaginationNextButton>
            <span class="hidden sm:block">Next</span>
            <ChevronRight class="h-4 w-4" />
          </PaginationNextButton>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  </div>
  {#if friendsData !== null && filteredFriendsData !== null}
    {#if friendsData.length !== 0}
      {#if filteredFriendsData.length !== 0}
        {#each itemsOnCurrentPage as { bans, summary, friendInfo } (summary.steam_id)}
          <ProfileInfo
            banInfo={bans}
            profileInfo={summary}
            friendInfos={{
              type: 'friend',
              data: friendsData,
              mainProfile: profileData,
              friendInfo
            }}
          />
        {/each}
      {:else}
        <div class="border rounded-md p-4 space-y-4">
          <h1>No friends match the query.</h1>
        </div>
      {/if}
    {:else}
      <div class="border rounded-md p-4 space-y-4">
        <h1>Friendslist is empty.</h1>
      </div>
    {/if}
  {:else}
    <div class="border rounded-md p-4 space-y-4">
      <h1>Friendslist is private.</h1>
    </div>
  {/if}
</div>
