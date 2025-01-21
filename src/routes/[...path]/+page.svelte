<script lang="ts">
  import type { PageData } from './$types';
  import ProfileInfo from '$lib/components/profile-info.svelte';
  import { ChevronLeft, ChevronRight, Search } from 'lucide-svelte';
  import type { z } from 'zod';
  import { banSchema, summarySchema, type FriendsData } from '$lib/schemas';
  import Fuse from 'fuse.js';
  import { Input } from '$lib/components/ui/input';
  import * as Pagination from '$lib/components/ui/pagination';
  import * as Card from '$lib/components/ui/card';
  import * as Select from '$lib/components/ui/select';

  type ProcessedData = {
    profileData: { bans: z.infer<typeof banSchema>; summary: z.infer<typeof summarySchema> };
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
  type SortDirection = 'ascending' | 'descending';
  type SortOptions = { value: SortValue; direction: SortDirection };

  const sortValues: { value: SortValue; label: string }[] = [
    { value: 'days_since_last_ban', label: 'Days Since Last Ban' },
    { value: 'community_banned', label: 'Community Banned' },
    { value: 'number_of_vac_bans', label: 'Number of VAC Bans' },
    { value: 'number_of_game_bans', label: 'Number of Game Bans' },
    { value: 'friends_since', label: 'Friends Since' },
    { value: 'steam_id', label: 'Steam ID' }
  ];
  const sortDirections: { value: SortDirection; label: string }[] = [
    { value: 'ascending', label: 'Ascending' },
    { value: 'descending', label: 'Descending' }
  ];

  function sortFriendsData({
    direction,
    value
  }: SortOptions): (lhs: FriendsData, rhs: FriendsData) => number {
    return (lhs: FriendsData, rhs: FriendsData): number => {
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

  const { data }: { data: PageData } = $props();

  let filter = $state('');

  let sortDirection = $state<SortDirection>(sortDirections[0].value);
  let sortDirectionTrigger = $derived(
    sortDirections.find(({ value }) => value === sortDirection)?.label
  );

  let sortValue = $state<SortValue>(sortValues[0].value);
  let sortValueTrigger = $derived(sortValues.find(({ value }) => value === sortValue)?.label);

  const setSortDirection = (val: string) => {
    if (val !== '') {
      sortDirection = val[0] as SortDirection;
    }
  };
  const setSortValue = (val: string) => {
    if (val !== '') {
      sortValue = val[0] as SortValue;
    }
  };

  const { data: innerData } = data;
  const { friendsData, profileData, requestsUsed, filteredFriendsData } = $derived(
    processData(innerData, filter, { direction: sortDirection, value: sortValue })
  );

  const perPage = 12;
  const siblingCount = 2;
  let currentPage = $state(1);

  const count = $derived(filteredFriendsData?.length ?? 0);
  const maxPages = $derived(Math.max(1, Math.ceil(count / perPage)));
  $effect(() => {
    currentPage = Math.min(currentPage, maxPages);
  });
  const itemsOnCurrentPage = $derived(
    filteredFriendsData?.slice((currentPage - 1) * perPage, currentPage * perPage) ?? []
  );
</script>

<svelte:head>
  <title>
    {profileData.summary.persona_name}
  </title>
</svelte:head>

<div class="grid grid-cols-1 xl:grid-cols-3 md:grid-cols-2 gap-2">
  <div class="col-span-1 xl:col-span-3 md:col-span-2">
    <Card.Root>
      <Card.Header>
        <Card.Title>Metadata</Card.Title>
      </Card.Header>
      <Card.Content>
        Loading this page used <b>{requestsUsed}</b> requests to the Steam API and took
        <b>{data.elapsedMs.toFixed(1)}ms</b>
      </Card.Content>
    </Card.Root>
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
        <Input bind:value={filter} placeholder="Search..." class="pl-9" />
      </div>
      <div class="grid md:grid-cols-2 gap-2">
        <Select.Root type="single" bind:value={sortDirection}>
          <Select.Trigger>{sortDirectionTrigger}</Select.Trigger>
          <Select.Content>
            {#each sortDirections as { value, label } (value)}
              <Select.Item {value}>{label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        <Select.Root type="single" bind:value={sortValue}>
          <Select.Trigger>{sortValueTrigger}</Select.Trigger>
          <Select.Content>
            {#each sortValues as { value, label } (value)}
              <Select.Item {value}>{label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  </div>
  <div class="col-span-1 xl:col-span-3 md:col-span-2">
    <Pagination.Root
      count={Math.max(1, count)}
      {perPage}
      {siblingCount}
      page={currentPage}
      onPageChange={(page) => {
        currentPage = Math.min(page, maxPages);
      }}
    >
      {#snippet children({ pages })}
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.PrevButton>
              <ChevronLeft class="w-4 h-4" />
              <span>Previous</span>
            </Pagination.PrevButton>
          </Pagination.Item>
          {#each pages as page (page.key)}
            {#if page.type === 'ellipsis'}
              <Pagination.Item>
                <Pagination.Ellipsis />
              </Pagination.Item>
            {:else}
              <Pagination.Item>
                <Pagination.Link {page} isActive={currentPage === page.value}>
                  {page.value}
                </Pagination.Link>
              </Pagination.Item>
            {/if}
          {/each}
          <Pagination.Item>
            <Pagination.NextButton>
              <span class="hidden sm:block">Next</span>
              <ChevronRight class="h-4 w-4" />
            </Pagination.NextButton>
          </Pagination.Item>
        </Pagination.Content>
      {/snippet}
    </Pagination.Root>
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
