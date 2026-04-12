import { parse } from 'yaml'
import { z } from 'zod'

import configRaw from './app-config.yml?raw'

const configSchema = z.object({
  app: z.object({
    title: z.string().min(1),
  }),
  api: z.object({
    baseUrl: z.string().min(1),
  }),
  player: z.object({
    defaultVolume: z.number().int().min(0).max(100),
    maxQueueItems: z.number().int().positive(),
  }),
  features: z.object({
    voteSkip: z.boolean(),
  }),
  logging: z.object({
    level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']),
  }),
})

const rawConfig = parse(configRaw)

const mergedConfig = {
  ...rawConfig,
  api: {
    ...rawConfig.api,
    baseUrl: import.meta.env.VITE_MUSIC_API_BASE_URL ?? rawConfig.api?.baseUrl,
  },
}

const parsed = configSchema.safeParse(mergedConfig)

if (!parsed.success) {
  throw new Error(`Invalid app config: ${parsed.error.message}`)
}

export const appConfig = parsed.data

export type AppConfig = typeof appConfig
