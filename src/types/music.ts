export type Track = {
  id: string
  title: string
  artist: string
  durationSec: number
  thumbnailUrl: string
  requestedBy: string
  sourceUrl: string
}

export type NowPlaying = {
  track: Track
  elapsedSec: number
}

export type MusicSnapshot = {
  roomId: string
  listeners: number
  volume: number
  voteSkip: {
    count: number
    threshold: number
  }
  nowPlaying: NowPlaying
  queue: Track[]
  isConnected: boolean
}

export type VoteSkipResponse = {
  alreadyVoted: boolean
  count: number
  threshold: number
  eligible: number
  skipped?: boolean
  snapshot: MusicSnapshot
}

export type YouTubeSearchResult = {
  title: string
  url: string
  durationSec: number
  thumbnailUrl: string
  channel: string
}

export type AuthUser = {
  username: string
  role: 'admin'
}

export type AuthSession = {
  authenticated: boolean
  user: AuthUser | null
}

export type AuthLoginResponse = {
  token: string
  user: AuthUser
}

export type CommandSnapshotResponse = {
  snapshot: MusicSnapshot
  user: string
}
