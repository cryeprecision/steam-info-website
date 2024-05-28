<script lang="ts">
  import type { z } from 'zod';
  import {
    type friendSchema,
    type banSchema,
    type summarySchema,
    type FriendsData
  } from '$lib/schemas';
  import FaceitLogo from '$lib/components/faceit-logo.svelte';
  import LeetifyLogo from '$lib/components/leetify-logo.svelte';
  import SteamLogo from '$lib/components/steam-logo.svelte';
  import Avatar from '$lib/components/ui/avatar/avatar.svelte';
  import AvatarImage from '$lib/components/ui/avatar/avatar-image.svelte';
  import Button from '$lib/components/ui/button/button.svelte';
  import { cn } from '$lib/utils';
  import { Braces } from 'lucide-svelte';
  import Card from '$lib/components/ui/card/card.svelte';
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import { format } from 'date-fns';
  import { getFlag } from '$lib/util';
  import { Dialog, DialogTrigger } from '$lib/components/ui/dialog';
  import { buttonVariants } from '$lib/components/ui/button';
  import DialogContent from '$lib/components/ui/dialog/dialog-content.svelte';
  import DialogHeader from '$lib/components/ui/dialog/dialog-header.svelte';
  import DialogTitle from '$lib/components/ui/dialog/dialog-title.svelte';
  import { countryCodeToName } from '$lib/country_code';
  import { formatDuration } from '$lib/format_duration';
  import * as Stats from 'simple-statistics';
  import _ from 'lodash';
  import { Tooltip, TooltipTrigger } from './ui/tooltip';
  import TooltipContent from './ui/tooltip/tooltip-content.svelte';
  import { roundToNearestMultiple } from '$lib/round';

  const LEETIFY_PREFIX = 'https://leetify.com/public/profile/';
  const FACEIT_PREFIX = 'https://www.faceit.com/en/search/player/';

  export let banInfo: z.infer<typeof banSchema>;
  export let profileInfo: z.infer<typeof summarySchema>;
  export let friendInfos:
    | {
        type: 'main';
        data: FriendsData[] | null;
      }
    | {
        type: 'friend';
        data: FriendsData[];
        friendInfo: z.infer<typeof friendSchema>;
        mainProfile: {
          bans: z.infer<typeof banSchema>;
          summary: z.infer<typeof summarySchema>;
        };
      };

  let className: string | null | undefined = undefined;
  export { className as class };

  $: ({
    persona_name,
    avatar_medium,
    avatar_full,
    steam_id,
    profile_url,
    real_name,
    local_country_code,
    community_visibility_state,
    last_logoff,
    persona_state,
    time_created,
    profile_state
  } = profileInfo);
  $: ({
    community_banned,
    days_since_last_ban,
    economy_ban,
    number_of_game_bans,
    number_of_vac_bans
  } = banInfo);

  $: friendInfosMainData = (() => {
    if (friendInfos.type !== 'main' || friendInfos.data === null || friendInfos.data.length === 0) {
      return null;
    }
    const { data } = friendInfos;

    const friendCount = data.length;
    const bannedFriendsCount = data.reduce((acc, next) => {
      const banned =
        next.bans.number_of_vac_bans > 0 ||
        next.bans.number_of_game_bans > 0 ||
        next.bans.community_banned;
      return acc + (banned ? 1 : 0);
    }, 0);
    const bannedFriendsRatio = bannedFriendsCount / friendCount;

    const friendAccountAgeStats = (() => {
      const friendAccountAges = data
        .map(({ summary: { time_created } }) => time_created?.getTime())
        .filter((time_created): time_created is number => time_created !== undefined);

      if (friendAccountAges.length < 2) {
        return null;
      }

      const averageAccountAge = new Date().getTime() - Stats.average(friendAccountAges);
      const accountAgeStdDev = Stats.standardDeviation(friendAccountAges);
      return { averageAccountAge, accountAgeStdDev };
    })();

    return {
      friendCount,
      bannedFriendsCount,
      bannedFriendsRatio,
      friendAccountAgeStats
    };
  })();

  $: friendInfosFriendData = (() => {
    if (friendInfos.type !== 'friend' || friendInfos.data.length === 0) {
      return null;
    }
    const { data: allData } = friendInfos;

    const thisData = allData.find(({ summary }) => summary.steam_id === steam_id);
    if (thisData === undefined) {
      return null;
    }

    const friendsSinceSorted = allData.map(({ friendInfo: { friends_since } }) => {
      return friends_since.getTime();
    });
    friendsSinceSorted.sort((lhs, rhs) => lhs - rhs);

    const OFFSET = 0x110000000000000n;
    const friendsAccountAgesSorted = allData.map(({ summary: { steam_id } }) => {
      return Number(BigInt(steam_id) - OFFSET);
    });
    friendsAccountAgesSorted.sort((lhs, rhs) => lhs - rhs);

    const durationQuantile = Stats.quantileRankSorted(
      friendsSinceSorted,
      thisData.friendInfo.friends_since.getTime()
    );

    const accountAgeQuantile = Stats.quantileRankSorted(
      friendsAccountAgesSorted,
      Number(BigInt(thisData.summary.steam_id) - OFFSET)
    );

    return { durationQuantile, accountAgeQuantile };
  })();

  $: [leetifyUrl, faceitUrl] = [LEETIFY_PREFIX + steam_id, FACEIT_PREFIX + steam_id];
</script>

<Card class={className}>
  <div class="flex p-4 justify-between gap-2 h-full">
    <div>
      <div class="flex flex-wrap gap-4 justify-between items-center pb-4">
        <div class="flex items-center space-x-4">
          <div>
            <Dialog>
              <DialogTrigger>
                <Avatar
                  class={cn(
                    'outline text-muted-foreground',
                    persona_state === 'Online' ? 'outline-green-400' : ''
                  )}
                >
                  <AvatarImage src={avatar_medium} alt={persona_name} loading="lazy" />
                </Avatar>
              </DialogTrigger>
              <DialogContent class="h-[34rem]">
                <DialogHeader>
                  <DialogTitle>Profile Picture</DialogTitle>
                </DialogHeader>
                <img
                  src={avatar_full}
                  alt={persona_name}
                  loading="lazy"
                  class="object-contain w-full rounded-md"
                />
              </DialogContent>
            </Dialog>
          </div>
          <div>
            <Tooltip>
              <TooltipTrigger>
                <p class="text-sm font-medium leading-none">
                  {persona_name}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                {real_name ?? 'This user has no real name set.'}
              </TooltipContent>
            </Tooltip>
            <p class="text-sm text-muted-foreground">{steam_id}</p>
          </div>
        </div>
      </div>
      <div class="space-y-2">
        <div>
          {#if profile_state === 'NotConfigured'}
            <Badge variant="destructive">Profile State: Not Configured</Badge>
          {/if}
          {#if time_created !== null}
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline">
                  Created: {format(time_created, 'yyyy-MM-dd HH:mm:ss')}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {formatDuration(time_created)}
              </TooltipContent>
            </Tooltip>
          {/if}
          <Badge variant={community_visibility_state === 'Private' ? 'destructive' : 'outline'}>
            Visibility: {community_visibility_state}
          </Badge>
          {#if local_country_code}
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline">
                  Country: {getFlag(local_country_code)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {countryCodeToName(local_country_code) ?? local_country_code}
              </TooltipContent>
            </Tooltip>
          {/if}
          {#if last_logoff}
            <Badge variant="outline">
              Last Logoff: {format(last_logoff, 'yyyy-MM-dd HH:mm:ss')}
            </Badge>
          {/if}
          {#if number_of_vac_bans > 0}
            <Badge variant="destructive">
              VAC Bans: {number_of_vac_bans}
            </Badge>
          {/if}
          {#if number_of_game_bans > 0}
            <Badge variant="destructive">
              Game Bans: {number_of_game_bans}
            </Badge>
          {/if}
          {#if days_since_last_ban > 0}
            <Badge variant={days_since_last_ban < 365 ? 'destructive' : 'outline'}>
              Days Since Last Ban: {days_since_last_ban}
            </Badge>
          {/if}
          {#if economy_ban !== 'None'}
            <Badge variant="destructive">
              Economy Ban: {economy_ban}
            </Badge>
          {/if}
          {#if community_banned}
            <Badge variant="destructive">Community Ban</Badge>
          {/if}
          {#if friendInfosMainData !== null}
            {@const { friendCount, bannedFriendsCount, bannedFriendsRatio, friendAccountAgeStats } =
              friendInfosMainData}
            <Badge variant="outline">
              Friends: {friendCount}
            </Badge>
            <Badge variant={bannedFriendsRatio > 0.2 ? 'destructive' : 'outline'}>
              Banned Friends: {bannedFriendsCount} ({(bannedFriendsRatio * 100).toFixed(0)}%)
            </Badge>
            {#if friendAccountAgeStats !== null}
              {@const { accountAgeStdDev, averageAccountAge } = friendAccountAgeStats}
              {@const MS_PER_DAY = 1000 * 60 * 60 * 24}
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline">
                    Friend Account Age: {formatDuration(
                      roundToNearestMultiple(averageAccountAge, MS_PER_DAY),
                      { skipZero: { minutes: true, seconds: true, hours: true } }
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  ±{formatDuration(roundToNearestMultiple(accountAgeStdDev, MS_PER_DAY), {
                    skipZero: { minutes: true, seconds: true, hours: true }
                  })}
                </TooltipContent>
              </Tooltip>
            {/if}
          {/if}
          {#if friendInfosFriendData !== null && friendInfos.type === 'friend'}
            {@const { durationQuantile, accountAgeQuantile } = friendInfosFriendData}
            {@const { friends_since } = friendInfos.friendInfo}
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline">
                  Friends Since: {format(friends_since, 'yyyy-MM-dd HH:mm:ss')}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                {formatDuration(friends_since)}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Badge
                  variant="outline"
                  class={durationQuantile >= 0.9
                    ? 'border-red-500/60'
                    : durationQuantile <= 0.1
                      ? 'border-green-500/60'
                      : ''}
                >
                  Friends Since Quantile: {durationQuantile.toFixed(2)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                A value of 0 means that this user was the first friend added.<br />
                A value of 1 means that this user is the most recently added friend.
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <Badge
                  variant="outline"
                  class={accountAgeQuantile >= 0.9
                    ? 'border-red-500/60'
                    : accountAgeQuantile <= 0.1
                      ? 'border-green-500/60'
                      : ''}
                >
                  Account Age Quantile: {accountAgeQuantile.toFixed(2)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                A value of 0 means that this user has the oldest account in the list.<br />
                A value of 1 means that this user has the most recently created account.
              </TooltipContent>
            </Tooltip>
          {/if}
        </div>
      </div>
    </div>
    <div class="flex">
      <div class="flex gap-1 flex-col justify-center">
        <Button href={faceitUrl} target="_blank" variant="outline">
          <FaceitLogo class="h-4 w-8" />
        </Button>
        <Button href={leetifyUrl} target="_blank" variant="outline">
          <LeetifyLogo class="h-4 w-8" />
        </Button>
        <Button href={profile_url} target="_blank" variant="outline">
          <SteamLogo class="h-4 w-8" />
        </Button>
        <Dialog>
          <DialogTrigger class={buttonVariants({ variant: 'outline' })}>
            <Braces class="w-8 h-4" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Raw JSON Data</DialogTitle>
            </DialogHeader>
            <p class="whitespace-pre font-mono text-xs border overflow-auto p-2 rounded-md">
              {JSON.stringify(banInfo, null, 2)}
            </p>
            <p class="whitespace-pre font-mono text-xs border overflow-auto p-2 rounded-md">
              {JSON.stringify(profileInfo, null, 2)}
            </p>
            {#if friendInfos.type === 'friend'}
              <p class="whitespace-pre font-mono text-xs border overflow-auto p-2 rounded-md">
                {JSON.stringify(friendInfos.friendInfo, null, 2)}
              </p>
            {/if}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  </div>
</Card>
