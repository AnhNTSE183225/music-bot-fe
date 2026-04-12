import { appConfig } from '@/config/app-config'
import type {
  AuthLoginResponse,
  AuthSession,
  CommandSnapshotResponse,
  MusicSnapshot,
  VoteSkipResponse,
  YouTubeSearchResult,
} from '@/types/music'

export interface MusicRepository {
  getSnapshot: () => Promise<MusicSnapshot>
  getSession: (token: string) => Promise<AuthSession>
  login: (username: string, password: string) => Promise<AuthLoginResponse>
  logout: (token: string) => Promise<void>
  setVolume: (volume: number) => Promise<MusicSnapshot>
  voteSkip: (voterId: string) => Promise<VoteSkipResponse>
  searchYouTube: (query: string) => Promise<YouTubeSearchResult[]>
  addYouTubeToQueue: (query: string, requester: string) => Promise<MusicSnapshot>
  adminSetVolume: (token: string, volume: number) => Promise<CommandSnapshotResponse>
  adminClear: (token: string) => Promise<CommandSnapshotResponse>
  adminSkip: (token: string) => Promise<CommandSnapshotResponse>
  adminStop: (token: string) => Promise<CommandSnapshotResponse>
  adminSkipTo: (token: string, index: number) => Promise<CommandSnapshotResponse>
  adminRemove: (token: string, index: number) => Promise<CommandSnapshotResponse>
}

const apiBaseUrl = appConfig.api.baseUrl.replace(/\/$/, '')

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | { error?: string }

  if (!response.ok) {
    const message = typeof data === 'object' && data && 'error' in data ? data.error : response.statusText
    throw new Error(message || 'Request failed')
  }

  return data as T
}

export class HttpMusicRepository implements MusicRepository {
  async getSnapshot(): Promise<MusicSnapshot> {
    const response = await fetch(`${apiBaseUrl}/state`)
    return parseJsonOrThrow<MusicSnapshot>(response)
  }

  async getSession(token: string): Promise<AuthSession> {
    const response = await fetch(`${apiBaseUrl}/auth/session`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return parseJsonOrThrow<AuthSession>(response)
  }

  async login(username: string, password: string): Promise<AuthLoginResponse> {
    const response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })

    return parseJsonOrThrow<AuthLoginResponse>(response)
  }

  async logout(token: string): Promise<void> {
    await fetch(`${apiBaseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  async setVolume(volume: number): Promise<MusicSnapshot> {
    const response = await fetch(`${apiBaseUrl}/volume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ volume }),
    })

    return parseJsonOrThrow<MusicSnapshot>(response)
  }

  async voteSkip(voterId: string): Promise<VoteSkipResponse> {
    const response = await fetch(`${apiBaseUrl}/skip-vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ voterId }),
    })

    return parseJsonOrThrow<VoteSkipResponse>(response)
  }

  async searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
    const response = await fetch(`${apiBaseUrl}/youtube/search?q=${encodeURIComponent(query)}`)
    const data = await parseJsonOrThrow<{ results: YouTubeSearchResult[] }>(response)
    return data.results
  }

  async addYouTubeToQueue(query: string, requester: string): Promise<MusicSnapshot> {
    const response = await fetch(`${apiBaseUrl}/queue/youtube`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, requester }),
    })

    const data = await parseJsonOrThrow<{ snapshot: MusicSnapshot }>(response)
    return data.snapshot
  }

  async adminSetVolume(token: string, volume: number): Promise<CommandSnapshotResponse> {
    const response = await fetch(`${apiBaseUrl}/admin/volume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ volume }),
    })

    return parseJsonOrThrow<CommandSnapshotResponse>(response)
  }

  async adminClear(token: string): Promise<CommandSnapshotResponse> {
    const response = await fetch(`${apiBaseUrl}/admin/clear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return parseJsonOrThrow<CommandSnapshotResponse>(response)
  }

  async adminSkip(token: string): Promise<CommandSnapshotResponse> {
    const response = await fetch(`${apiBaseUrl}/admin/skip`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return parseJsonOrThrow<CommandSnapshotResponse>(response)
  }

  async adminStop(token: string): Promise<CommandSnapshotResponse> {
    const response = await fetch(`${apiBaseUrl}/admin/stop`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return parseJsonOrThrow<CommandSnapshotResponse>(response)
  }

  async adminSkipTo(token: string, index: number): Promise<CommandSnapshotResponse> {
    const response = await fetch(`${apiBaseUrl}/admin/skipto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ index }),
    })

    return parseJsonOrThrow<CommandSnapshotResponse>(response)
  }

  async adminRemove(token: string, index: number): Promise<CommandSnapshotResponse> {
    const response = await fetch(`${apiBaseUrl}/admin/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ index }),
    })

    return parseJsonOrThrow<CommandSnapshotResponse>(response)
  }
}
