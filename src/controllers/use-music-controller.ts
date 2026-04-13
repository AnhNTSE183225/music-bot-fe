import { useEffect, useMemo, useState } from 'react'

import { appConfig } from '@/config/app-config'
import { logger } from '@/lib/logger'
import { HttpMusicRepository } from '@/repositories/music-repository'
import { MusicService } from '@/services/music-service'
import { BrowserYouTubeRepository } from '@/repositories/youtube-repository'
import { YouTubeService } from '@/services/youtube-service'
import type { AuthUser, MusicSnapshot, YouTubeSearchResult } from '@/types/music'

const repository = new HttpMusicRepository()
const service = new MusicService(repository)
const youtubeRepository = new BrowserYouTubeRepository()
const youtubeService = new YouTubeService(youtubeRepository)

const voterStorageKey = 'musicbot:voter-id'
const adminTokenStorageKey = 'musicbot:admin-token'
const youtubeApiPortalUrl = 'https://console.cloud.google.com/apis/credentials'

const getOrCreateVoterId = () => {
  const existing = localStorage.getItem(voterStorageKey)
  if (existing) {
    return existing
  }

  const created = `web-${crypto.randomUUID()}`
  localStorage.setItem(voterStorageKey, created)
  return created
}

export function useMusicController() {
  const [snapshot, setSnapshot] = useState<MusicSnapshot | null>(null)
  const [searchResults, setSearchResults] = useState<YouTubeSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isQueueing, setIsQueueing] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [adminUser, setAdminUser] = useState<AuthUser | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [youtubeApiKey, setYoutubeApiKeyState] = useState<string>(() => BrowserYouTubeRepository.getStoredApiKey())

  const refreshSnapshot = async () => {
    const nextSnapshot = await service.getSnapshot()
    setSnapshot(service.trimQueue(nextSnapshot, appConfig.player.maxQueueItems))
    return nextSnapshot
  }

  const refreshSession = async (token: string) => {
    const session = await service.getSession(token)
    if (!session.authenticated || !session.user) {
      throw new Error('Admin session is no longer valid')
    }

    setAuthToken(token)
    setAdminUser(session.user)
    localStorage.setItem(adminTokenStorageKey, token)
    return session.user
  }

  useEffect(() => {
    let mounted = true

    refreshSnapshot()
      .then((nextSnapshot) => {
        if (!mounted) {
          return
        }

        setSnapshot(service.trimQueue(nextSnapshot, appConfig.player.maxQueueItems))
        logger.info('Loaded music snapshot')
      })
      .catch((error) => {
        setLastError(String(error))
        logger.error('Failed to load music snapshot', error)
      })

    const token = localStorage.getItem(adminTokenStorageKey)
    if (token) {
      refreshSession(token)
        .catch((error) => {
          localStorage.removeItem(adminTokenStorageKey)
          setAuthToken(null)
          setAdminUser(null)
          logger.warn('Admin session expired', error)
        })
        .finally(() => {
          if (mounted) {
            setIsAuthLoading(false)
          }
        })
    } else {
      setIsAuthLoading(false)
    }

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      refreshSnapshot().catch((error) => {
        logger.warn('Snapshot polling failed', error)
      })
    }, 3000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const progress = useMemo(() => {
    if (!snapshot) {
      return 0
    }

    return service.getProgressPercent(snapshot)
  }, [snapshot])

  const onVoteSkip = async () => {
    if (!appConfig.features.voteSkip) {
      return
    }

    const voteResult = await service.voteSkip(getOrCreateVoterId())
    setSnapshot(voteResult.snapshot)
    logger.info('Vote skip triggered', {
      votes: voteResult.count,
      threshold: voteResult.threshold,
      alreadyVoted: voteResult.alreadyVoted,
    })
  }

  const onVolumeChange = async (volume: number) => {
    if (!authToken) {
      setLastError('Admin login required for volume control')
      return
    }

    try {
      const result = await service.setVolume(authToken, volume)
      setSnapshot(result.snapshot)
      logger.debug('Volume changed', { volume, user: result.user })
    } catch (error) {
      setLastError(String(error))
      logger.error('Failed to change volume', error)
    }
  }

  const onSearchYouTube = async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    setLastError(null)

    try {
      const results = await youtubeService.search(trimmed)
      setSearchResults(results)
      logger.info('YouTube search completed', { count: results.length })
    } catch (error) {
      setLastError(String(error))
      logger.error('YouTube search failed', error)
    } finally {
      setIsSearching(false)
    }
  }

  const login = async (username: string, password: string) => {
    setLastError(null)
    const result = await service.login(username, password)
    localStorage.setItem(adminTokenStorageKey, result.token)
    setAuthToken(result.token)
    setAdminUser(result.user)
    logger.info('Admin logged in', { username: result.user.username })
    return result.user
  }

  const logout = async () => {
    const token = authToken ?? localStorage.getItem(adminTokenStorageKey)
    if (token) {
      await service.logout(token)
    }
    localStorage.removeItem(adminTokenStorageKey)
    setAuthToken(null)
    setAdminUser(null)
    logger.info('Admin logged out')
  }

  const adminClear = async () => {
    if (!authToken) return
    const result = await service.adminClear(authToken)
    setSnapshot(result.snapshot)
  }

  const adminSkip = async () => {
    if (!authToken) return
    const result = await service.adminSkip(authToken)
    setSnapshot(result.snapshot)
  }

  const adminStop = async () => {
    if (!authToken) return
    const result = await service.adminStop(authToken)
    setSnapshot(result.snapshot)
  }

  const adminSkipTo = async (index: number) => {
    if (!authToken) return
    const result = await service.adminSkipTo(authToken, index)
    setSnapshot(result.snapshot)
  }

  const adminRemove = async (index: number) => {
    if (!authToken) return
    const result = await service.adminRemove(authToken, index)
    setSnapshot(result.snapshot)
  }

  const onAddYouTubeToQueue = async (query: string, requester: string) => {
    setIsQueueing(true)
    setLastError(null)

    try {
      const nextSnapshot = await service.addYouTubeToQueue(query, requester)
      setSnapshot(nextSnapshot)
      logger.info('YouTube track queued from web', { query })
    } catch (error) {
      setLastError(String(error))
      logger.error('Failed to queue YouTube track', error)
      throw error
    } finally {
      setIsQueueing(false)
    }
  }

  const clearError = () => {
    setLastError(null)
  }

  const setYouTubeApiKey = (apiKey: string) => {
    BrowserYouTubeRepository.setStoredApiKey(apiKey)
    setYoutubeApiKeyState(BrowserYouTubeRepository.getStoredApiKey())
  }

  const clearYouTubeApiKey = () => {
    BrowserYouTubeRepository.setStoredApiKey('')
    setYoutubeApiKeyState('')
  }

  return {
    snapshot,
    progress,
    onVoteSkip,
    onVolumeChange,
    onSearchYouTube,
    onAddYouTubeToQueue,
    login,
    logout,
    adminClear,
    adminSkip,
    adminStop,
    adminSkipTo,
    adminRemove,
    searchResults,
    isSearching,
    isQueueing,
    lastError,
    clearError,
    youtubeApiKey,
    hasYouTubeApiKey: Boolean(youtubeApiKey),
    youtubeApiPortalUrl,
    setYouTubeApiKey,
    clearYouTubeApiKey,
    isAdmin: Boolean(authToken && adminUser),
    adminUser,
    isAuthLoading,
    canVoteSkip: appConfig.features.voteSkip,
    appTitle: appConfig.app.title,
  }
}
