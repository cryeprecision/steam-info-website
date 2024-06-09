import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { z } from 'zod';
import { responseSchema } from '$lib/schemas';
import { error, redirect } from '@sveltejs/kit';
import { STEAM_ID_RE, extractSteamId } from '$lib/extract-id';

type InnerData = z.infer<typeof responseSchema>;
type Data = { data: InnerData; elapsedMs: number };

// https://kit.svelte.dev/docs/page-options
export const prerender = false;

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
