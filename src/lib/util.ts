import type { z } from 'zod';
import type { banSchema, friendSchema } from './schemas';

export function bannedFriends(
  friends: Record<string, z.infer<typeof friendSchema>>,
  banInfos: Record<string, z.infer<typeof banSchema>>
): { totalFriends: number; bannedFriends: number; bannedPercentage: number } {
  const bannedCount = Object.keys(friends)
    .map((steamId) => banInfos[steamId])
    .reduce((acc, banInfo) => {
      const banned = banInfo.number_of_vac_bans > 0 || banInfo.number_of_game_bans > 0;
      return acc + (banned ? 1 : 0);
    }, 0);
  return {
    totalFriends: Object.keys(friends).length,
    bannedFriends: bannedCount,
    bannedPercentage: Math.ceil((bannedCount / Object.keys(friends).length) * 100)
  };
}

// const getFlag=c=>String.fromCodePoint(...[...c.toUpperCase()].map(x=>0x1f1a5+x.charCodeAt()))
export function getFlag(countryCode: string): string {
  return String.fromCodePoint(
    ...[...countryCode.toUpperCase()].map((x) => 0x00_01_f1_a5 + x.charCodeAt(0))
  );
}

export function fuzzy_search(needle: string, haystack: string): boolean {
  const hlen = haystack.length;
  const nlen = needle.length;
  if (nlen > hlen) {
    return false;
  }

  needle = needle.toLocaleLowerCase();
  haystack = haystack.toLocaleLowerCase();

  if (nlen === hlen) {
    return needle === haystack;
  }

  outer: for (let i = 0, j = 0; i < nlen; i++) {
    const char = needle.charCodeAt(i);
    while (j < hlen) {
      if (haystack.charCodeAt(j++) === char) {
        continue outer;
      }
    }
    return false;
  }
  return true;
}
