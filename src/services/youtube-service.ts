import type { YouTubeSearchResult } from '@/types/music'

import { BrowserYouTubeRepository } from '@/repositories/youtube-repository'

export class YouTubeService {
  private readonly repository: BrowserYouTubeRepository

  constructor(repository: BrowserYouTubeRepository) {
    this.repository = repository
  }

  search(query: string): Promise<YouTubeSearchResult[]> {
    return this.repository.search(query)
  }
}