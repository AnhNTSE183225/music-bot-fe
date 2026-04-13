import type { YouTubeSearchResult } from '@/types/music'

export const youtubeApiKeyStorageKey = 'musicbot:youtube-api-key'
export const missingYouTubeApiKeyError =
  'YouTube API key is missing. Open API Console and set your key before searching.'

type YouTubeSearchItem = {
  id?: {
    videoId?: string
  }
  snippet?: {
    title?: string
    channelTitle?: string
    thumbnails?: {
      default?: { url?: string }
      medium?: { url?: string }
      high?: { url?: string }
    }
  }
}

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[]
}

type YouTubeVideoItem = {
  id?: string
  contentDetails?: {
    duration?: string
  }
}

type YouTubeVideosResponse = {
  items?: YouTubeVideoItem[]
}

const searchBaseUrl = 'https://www.googleapis.com/youtube/v3/search'
const videosBaseUrl = 'https://www.googleapis.com/youtube/v3/videos'

function parseJsonOrThrow<T>(response: Response): Promise<T> {
  return response.json().then((data) => {
    if (!response.ok) {
      const message = typeof data === 'object' && data && 'error' in data ? JSON.stringify(data.error) : response.statusText
      throw new Error(message || 'YouTube search failed')
    }

    return data as T
  })
}

function parseIsoDuration(duration: string): number {
  const matches = duration.match(
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/
  )

  if (!matches) {
    return 0
  }

  const days = Number(matches[1] ?? 0)
  const hours = Number(matches[2] ?? 0)
  const minutes = Number(matches[3] ?? 0)
  const seconds = Number(matches[4] ?? 0)

  return days * 86400 + hours * 3600 + minutes * 60 + seconds
}

export class BrowserYouTubeRepository {
  static getStoredApiKey(): string {
    const stored = localStorage.getItem(youtubeApiKeyStorageKey)
    return stored?.trim() ?? ''
  }

  static setStoredApiKey(apiKey: string): void {
    const normalized = apiKey.trim()
    if (!normalized) {
      localStorage.removeItem(youtubeApiKeyStorageKey)
      return
    }

    localStorage.setItem(youtubeApiKeyStorageKey, normalized)
  }

  private resolveApiKey(): string {
    return BrowserYouTubeRepository.getStoredApiKey()
  }

  async search(query: string): Promise<YouTubeSearchResult[]> {
    const apiKey = this.resolveApiKey()

    if (!apiKey) {
      throw new Error(missingYouTubeApiKeyError)
    }

    const searchUrl = new URL(searchBaseUrl)
    searchUrl.searchParams.set('part', 'snippet')
    searchUrl.searchParams.set('type', 'video')
    searchUrl.searchParams.set('maxResults', '8')
    searchUrl.searchParams.set('q', query)
    searchUrl.searchParams.set('key', apiKey)

    const searchResponse = await fetch(searchUrl.toString())
    const searchData = await parseJsonOrThrow<YouTubeSearchResponse>(searchResponse)
    const items = searchData.items ?? []

    const videoIds = items
      .map((item) => item.id?.videoId)
      .filter((videoId): videoId is string => Boolean(videoId))

    if (videoIds.length === 0) {
      return []
    }

    const videosUrl = new URL(videosBaseUrl)
    videosUrl.searchParams.set('part', 'contentDetails')
    videosUrl.searchParams.set('id', videoIds.join(','))
    videosUrl.searchParams.set('key', apiKey)

    const videosResponse = await fetch(videosUrl.toString())
    const videosData = await parseJsonOrThrow<YouTubeVideosResponse>(videosResponse)
    const durationById = new Map(
      (videosData.items ?? [])
        .map((item) => {
          const videoId = item.id
          const duration = item.contentDetails?.duration

          if (!videoId || !duration) {
            return null
          }

          return [videoId, parseIsoDuration(duration)] as const
        })
        .filter((entry): entry is readonly [string, number] => entry !== null)
    )

    return items
      .map((item) => {
        const videoId = item.id?.videoId
        const snippet = item.snippet

        if (!videoId || !snippet) {
          return null
        }

        const thumbnailUrl = snippet.thumbnails?.high?.url ?? snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? ''

        return {
          title: snippet.title ?? 'Untitled',
          url: `https://www.youtube.com/watch?v=${videoId}`,
          durationSec: durationById.get(videoId) ?? 0,
          thumbnailUrl,
          channel: snippet.channelTitle ?? 'YouTube',
        }
      })
      .filter((result): result is YouTubeSearchResult => Boolean(result))
  }
}