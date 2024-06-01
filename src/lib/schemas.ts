import { z } from 'zod';

export const banSchema = z
  .object({
    steam_id: z.string(),
    community_banned: z.boolean(),
    vac_banned: z.boolean(),
    number_of_vac_bans: z.number().int(),
    days_since_last_ban: z.number().int(),
    number_of_game_bans: z.number().int(),
    economy_ban: z.enum(['None', 'Probation', 'Banned'])
  })
  .strict();

export const friendSchema = z
  .object({
    steam_id: z.string(),
    relationship: z.string(),
    friends_since: z.string().transform((str) => new Date(str))
  })
  .strict();

export const summarySchema = z
  .object({
    steam_id: z.string(),
    community_visibility_state: z.enum(['Private', 'FriendsOnly', 'Public']),
    profile_state: z.enum(['Configured', 'NotConfigured']),
    persona_name: z.string(),
    profile_url: z.string().url(),
    avatar: z.string().url(),
    avatar_medium: z.string().url(),
    avatar_full: z.string().url(),
    avatar_hash: z.string(),
    last_logoff: z
      .string()
      .transform((str) => new Date(str))
      .nullable(),
    persona_state: z.enum([
      'Offline',
      'Online',
      'Busy',
      'Away',
      'Snooze',
      'LookingToTrade',
      'LookingToPlay',
      'Invisible'
    ]),
    real_name: z.string().nullable(),
    primary_clan_id: z.string().nullable(),
    time_created: z
      .string()
      .transform((str) => new Date(str))
      .nullable(),
    persona_state_flags: z.number().int().nullable(),
    local_country_code: z.string().nullable()
  })
  .strict();

export const vanityResponseSchema = z.string();

export const responseSchema = z
  .object({
    steam_id: z.string(),
    bans: z.record(z.string(), banSchema),
    friends: z.record(z.string(), friendSchema).nullable(),
    summaries: z.record(z.string(), summarySchema)
  })
  .strict();

export type FriendsData = {
  bans: z.infer<typeof banSchema>;
  summary: z.infer<typeof summarySchema>;
  friendInfo: z.infer<typeof friendSchema>;
};
