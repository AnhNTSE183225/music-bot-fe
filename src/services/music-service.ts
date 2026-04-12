import type { MusicRepository } from '@/repositories/music-repository'
import type { CommandSnapshotResponse, MusicSnapshot, VoteSkipResponse, YouTubeSearchResult } from '@/types/music'

export class MusicService {
  private readonly repository: MusicRepository

  constructor(repository: MusicRepository) {
    this.repository = repository
  }

  getSnapshot(): Promise<MusicSnapshot> {
    return this.repository.getSnapshot()
  }

  getProgressPercent(snapshot: MusicSnapshot): number {
    const { elapsedSec, track } = snapshot.nowPlaying
    if (!track.durationSec || track.durationSec <= 0) {
      return 0
    }
    return Math.min(100, Math.round((elapsedSec / track.durationSec) * 100))
  }

  setVolume(token: string, volume: number): Promise<CommandSnapshotResponse> {
    return this.repository.adminSetVolume(token, volume)
  }

  voteSkip(voterId: string): Promise<VoteSkipResponse> {
    return this.repository.voteSkip(voterId)
  }

  searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
    return this.repository.searchYouTube(query)
  }

  addYouTubeToQueue(query: string, requester: string): Promise<MusicSnapshot> {
    return this.repository.addYouTubeToQueue(query, requester)
  }

  login(username: string, password: string) {
    return this.repository.login(username, password)
  }

  getSession(token: string) {
    return this.repository.getSession(token)
  }

  logout(token: string) {
    return this.repository.logout(token)
  }

  adminClear(token: string) {
    return this.repository.adminClear(token)
  }

  adminSkip(token: string) {
    return this.repository.adminSkip(token)
  }

  adminStop(token: string) {
    return this.repository.adminStop(token)
  }

  adminSkipTo(token: string, index: number) {
    return this.repository.adminSkipTo(token, index)
  }

  adminRemove(token: string, index: number) {
    return this.repository.adminRemove(token, index)
  }

  trimQueue(snapshot: MusicSnapshot, maxQueueItems: number): MusicSnapshot {
    return {
      ...snapshot,
      queue: snapshot.queue.slice(0, maxQueueItems),
    }
  }
}
