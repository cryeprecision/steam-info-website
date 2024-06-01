import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { z } from 'zod';
import { responseSchema, vanityResponseSchema } from '$lib/schemas';
import { error, redirect } from '@sveltejs/kit';

type InnerData = z.infer<typeof responseSchema>;
type Data = { data: InnerData; elapsedMs: number };

// https://kit.svelte.dev/docs/page-options
export const prerender = false;

const STEAM_ID_RE: RegExp = /^7\d{16}$/;
const VANITY_URL_RE: RegExp = /^[a-zA-Z0-9_-]+$/;

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

async function extractSteamId(apiUrl: string, path: string): Promise<string | null> {
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

async function loadData(apiUrl: string, steamId: string): Promise<InnerData> {
  const resp = await fetch(apiUrl + '/json/' + steamId);
  if (resp.status !== 200) {
    error(500, await resp.text());
  }

  const json = await resp.json();
  const parsed_ = responseSchema.safeParse(json);
  if (!parsed_.success) {
    error(500, "Couldn't parse json response");
  }
  const parsed = parsed_.data;

  // sanitize result for deleted steam profiles since they still show up as friends
  if (parsed.friends !== null) {
    const deletedSteamIds = new Set(
      Object.keys(parsed.friends).filter((steamId) => {
        return !(steamId in parsed.summaries);
      })
    );
    parsed.friends = Object.fromEntries(
      Object.entries(parsed.friends).filter(([steamId]) => !deletedSteamIds.has(steamId))
    );
    parsed.bans = Object.fromEntries(
      Object.entries(parsed.bans).filter(([steamId]) => !deletedSteamIds.has(steamId))
    );
    parsed.summaries = Object.fromEntries(
      Object.entries(parsed.summaries).filter(([steamId]) => !deletedSteamIds.has(steamId))
    );
  }

  return parsed;
}

export const load: PageServerLoad = async (event): Promise<Data> => {
  const apiUrl = env.API_URL;
  if (apiUrl === undefined || apiUrl.length === 0) {
    error(500, 'The idiot forgot to set an environment variable');
  }

  const { params } = event;
  const { path } = params;

  if (path.length === 0) {
    error(400, 'Missing profile URL');
  }

  const steamId = await extractSteamId(apiUrl, path);
  if (steamId === null || !STEAM_ID_RE.test(steamId)) {
    error(400, 'Invalid profile URL');
  }

  if (path !== `profiles/${steamId}`) {
    redirect(307, `/profiles/${steamId}`);
  }

  const startTime = performance.now();
  const data = await loadData(apiUrl, steamId);
  const elapsedMs = performance.now() - startTime;

  return { data, elapsedMs };
};
