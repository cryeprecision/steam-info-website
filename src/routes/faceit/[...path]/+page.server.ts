import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';
import { STEAM_ID_RE, FACEIT_PREFIX, extractSteamId } from '$lib/extract-id';

export const load: PageServerLoad = async (event) => {
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

  redirect(302, FACEIT_PREFIX + steamId);
};
