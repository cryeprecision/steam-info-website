import { error } from '@sveltejs/kit';
import { vanityResponseSchema } from './schemas';

export const STEAM_ID_RE: RegExp = /^7\d{16}$/;
export const VANITY_URL_RE: RegExp = /^[a-zA-Z0-9_-]+$/;

export const LEETIFY_PREFIX = 'https://leetify.com/public/profile/';
export const FACEIT_PREFIX = 'https://www.faceit.com/en/search/player/';

const VANITY_PREFIXES: string[] = [
  'https://steamcommunity.com/id/',
  'steamcommunity.com/id/',
  'id/'
];
const ID_PREFIXES: string[] = [
  'https://steamcommunity.com/profiles/',
  'steamcommunity.com/profiles/',
  'profiles/'
];

async function resolveVanityUrl(apiUrl: string, vanityUrl: string): Promise<string> {
  const resp = await fetch(apiUrl + '/vanity/' + vanityUrl);
  if (resp.status !== 200) {
    error(500, await resp.text());
  }

  const json = await resp.json();
  const parsed = vanityResponseSchema.safeParse(json);
  if (!parsed.success) {
    error(500, "Couldn't parse vanity response");
  }

  return parsed.data;
}

export async function extractSteamId(apiUrl: string, path: string): Promise<string | null> {
  for (const idPrefix of ID_PREFIXES) {
    if (path.startsWith(idPrefix)) {
      const suffix = path.substring(idPrefix.length);
      return suffix.split('/')[0];
    }
  }

  const vanityUrl = ((): string | null => {
    for (const vanityPrefix of VANITY_PREFIXES) {
      if (path.startsWith(vanityPrefix)) {
        const suffix = path.substring(vanityPrefix.length);
        return suffix.split('/')[0];
      }
    }
    return null;
  })();

  if (vanityUrl === null || !VANITY_URL_RE.test(vanityUrl)) {
    return null;
  }

  const steamId = await resolveVanityUrl(apiUrl, vanityUrl);
  return steamId;
}
