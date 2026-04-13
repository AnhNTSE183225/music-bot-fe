import { type FormEvent, useState } from 'react'
import {
  ExternalLink,
  Headphones,
  Lock,
  LogIn,
  LogOut,
  ListMusic,
  Search,
  SkipForward,
  Square,
  Trash2,
  Users,
  Volume2,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMusicController } from '@/controllers/use-music-controller'

function App() {
  const {
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
    isAuthLoading,
    isAdmin,
    adminUser,
    lastError,
    clearError,
    youtubeApiKey,
    hasYouTubeApiKey,
    youtubeApiPortalUrl,
    setYouTubeApiKey,
    canVoteSkip,
    appTitle,
  } = useMusicController()

  const [searchQuery, setSearchQuery] = useState('lofi hip hop')
  const [requesterName, setRequesterName] = useState('Web User')
  const [pendingUrl, setPendingUrl] = useState<string | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginBusy, setLoginBusy] = useState(false)
  const [volumeDraft, setVolumeDraft] = useState<number | null>(null)
  const [youtubeKeyOpen, setYoutubeKeyOpen] = useState(false)
  const [youtubeKeyInput, setYoutubeKeyInput] = useState(youtubeApiKey)

  const referrerListValue = Array.from(
    new Set([
      'http://localhost:5173/*',
      'http://127.0.0.1:5173/*',
      `${window.location.origin}/*`,
    ])
  ).join('\n')
  const apiRestrictionValue = 'YouTube Data API v3'

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remain = seconds % 60
    return `${minutes}:${String(remain).padStart(2, '0')}`
  }

  if (!snapshot) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 p-6 text-zinc-100">
        <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center rounded-3xl border border-white/10 bg-black/30 backdrop-blur-lg">
          <p className="text-sm tracking-wide text-zinc-300">Loading music state...</p>
        </div>
      </main>
    )
  }

  const now = snapshot.nowPlaying.track
  const canRenderNowPlaying = now.id !== 'none' && now.durationSec > 0
  const recentUsers = Array.from(
    new Set([now.requestedBy, ...snapshot.queue.map((track) => track.requestedBy)].filter(Boolean))
  ).slice(0, 6)

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!hasYouTubeApiKey) {
      setYoutubeKeyInput(youtubeApiKey)
      setYoutubeKeyOpen(true)
      return
    }

    await onSearchYouTube(searchQuery)
  }

  const handleSaveYouTubeKey = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setYouTubeApiKey(youtubeKeyInput)
    setYoutubeKeyOpen(false)
  }

  const copyToClipboard = async (value: string) => {
    await navigator.clipboard.writeText(value)
  }

  const handleVolumeCommit = async (value: number) => {
    try {
      await onVolumeChange(value)
    } finally {
      setVolumeDraft(null)
    }
  }

  const handleConfirmAdd = async () => {
    if (!pendingUrl) {
      return
    }

    await onAddYouTubeToQueue(pendingUrl, requesterName)
    setPendingUrl(null)
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoginBusy(true)
    setLoginError(null)

    try {
      await login(adminUsername, adminPassword)
      setLoginOpen(false)
      setAdminPassword('')
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoginBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgb(34_197_94_/_0.28),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgb(14_116_144_/_0.35),_transparent_45%),linear-gradient(140deg,_rgb(9_9_11),_rgb(24_24_27)_55%,_rgb(9_9_11))] p-4 text-zinc-100 sm:p-8">
      <div className="mx-auto mb-4 flex max-w-[1500px] items-center justify-between rounded-2xl border border-white/10 bg-black/35 px-4 py-3 shadow-2xl backdrop-blur-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Music Bot Web</p>
          <h1 className="text-lg font-semibold text-zinc-100">{appTitle}</h1>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && adminUser ? (
            <Badge className="border border-emerald-400/30 bg-emerald-400/15 text-emerald-200">
              <Lock className="mr-1 h-3.5 w-3.5" />
              Admin: {adminUser.username}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-white/15 text-zinc-300">
              Open access mode
            </Badge>
          )}

          {isAdmin ? (
            <Button variant="outline" onClick={() => void logout()} disabled={isAuthLoading}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          ) : (
            <Button onClick={() => setLoginOpen(true)} disabled={isAuthLoading}>
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Button>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-[1500px] gap-4 xl:grid-cols-[1fr_1.2fr_1fr]">
        <Card className="border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="secondary" className="bg-emerald-400/20 text-emerald-300">
                <Headphones className="mr-1 h-3.5 w-3.5" />
                Live Room
              </Badge>
              <p className="text-sm text-zinc-300">{appTitle}</p>
            </div>
            <CardTitle className="text-3xl font-semibold tracking-tight">{now.title}</CardTitle>
            <p className="text-zinc-300">{now.artist}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              {now.thumbnailUrl ? (
                <img src={now.thumbnailUrl} alt={now.title} className="h-64 w-full object-cover" />
              ) : (
                <div className="flex h-64 items-center justify-center bg-zinc-900 text-zinc-400">
                  Waiting for playback
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-sm text-zinc-300">
                <span>{formatTime(snapshot.nowPlaying.elapsedSec)}</span>
                <span>{canRenderNowPlaying ? formatTime(now.durationSec) : '--:--'}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 text-zinc-300">
                  <Volume2 className="h-4 w-4" />
                  Volume
                </span>
                <span>{snapshot.volume}%</span>
              </div>
              <Slider
                value={[volumeDraft ?? snapshot.volume]}
                max={100}
                step={1}
                disabled={!isAdmin}
                onValueChange={(value) => {
                  const nextValue = Array.isArray(value) ? value[0] : value
                  setVolumeDraft(nextValue ?? snapshot.volume)
                }}
                onValueCommitted={(value) => {
                  const nextValue = Array.isArray(value) ? value[0] : value
                  setVolumeDraft(nextValue ?? snapshot.volume)
                  void handleVolumeCommit(nextValue ?? snapshot.volume)
                }}
              />
              {!isAdmin && (
                <p className="text-xs text-zinc-500">Login to unlock volume control.</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => void onVoteSkip()}
                disabled={!canVoteSkip}
                className="bg-emerald-500 text-black hover:bg-emerald-400"
              >
                <SkipForward className="mr-2 h-4 w-4" />
                Vote Skip ({snapshot.voteSkip.count}/{snapshot.voteSkip.threshold})
              </Button>
              <Badge variant="outline" className="border-white/20 text-zinc-300">
                Requested by {now.requestedBy}
              </Badge>
            </div>

            {!snapshot.isConnected && (
              <p className="rounded-lg border border-amber-300/20 bg-amber-200/10 px-3 py-2 text-sm text-amber-200">
                Bot is currently not connected to a voice channel.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl">YouTube Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSearch} className="grid gap-3">
              <div className="grid gap-2">
                <label className="text-sm text-zinc-300" htmlFor="search-query">
                  Search keyword
                </label>
                <Input
                  id="search-query"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="border-white/15 bg-zinc-900/80"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-zinc-300" htmlFor="requester-name">
                  Display name for queue request
                </label>
                <Input
                  id="requester-name"
                  value={requesterName}
                  onChange={(event) => setRequesterName(event.target.value)}
                  className="border-white/15 bg-zinc-900/80"
                />
              </div>

              <Button type="submit" className="bg-cyan-400 text-black hover:bg-cyan-300">
                <Search className="mr-2 h-4 w-4" />
                {isSearching ? 'Searching...' : 'Search YouTube'}
              </Button>
            </form>

            {!hasYouTubeApiKey && (
              <div className="rounded-lg border border-amber-300/20 bg-amber-200/10 px-3 py-2 text-sm text-amber-200">
                YouTube API key is not set on this browser. Press search to open Google Cloud and paste your key.
              </div>
            )}

            <Button type="button" variant="outline" className="border-white/15" onClick={() => setYoutubeKeyOpen(true)}>
              Show API Key Setup Instructions
            </Button>

            <ScrollArea className="h-[460px]">
              <ul className="space-y-2">
                {searchResults.map((result) => (
                  <li key={result.url} className="rounded-lg border border-white/10 bg-zinc-900/70 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{result.title}</p>
                        <p className="text-sm text-zinc-400">{result.channel}</p>
                        <p className="text-xs text-zinc-500">{formatTime(result.durationSec)}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setPendingUrl(result.url)}>
                        Add
                      </Button>
                    </div>
                    <div className="mt-2">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200"
                      >
                        Open YouTube
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>

            {lastError && (
              <div className="rounded-lg border border-rose-300/20 bg-rose-200/10 px-3 py-2 text-sm text-rose-200">
                <div className="flex items-center justify-between gap-2">
                  <span>{lastError}</span>
                  <Button variant="ghost" size="sm" onClick={clearError}>
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ListMusic className="h-5 w-5" />
              Queue & Room
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAdmin && (
              <div className="mb-4">
                <p className="mb-3 text-sm font-medium text-zinc-100">Admin Controls</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="justify-start gap-2" onClick={() => void adminClear()}>
                    <span className="inline-flex w-4 justify-center">
                      <Trash2 className="h-4 w-4" />
                    </span>
                    <span>Clear queue</span>
                  </Button>
                  <Button variant="outline" className="justify-start gap-2" onClick={() => void adminSkip()}>
                    <span className="inline-flex w-4 justify-center">
                      <SkipForward className="h-4 w-4" />
                    </span>
                    <span>Skip now</span>
                  </Button>
                  <Button variant="outline" className="justify-start gap-2" onClick={() => void adminStop()}>
                    <span className="inline-flex w-4 justify-center">
                      <Square className="h-4 w-4" />
                    </span>
                    <span>Stop bot</span>
                  </Button>
                </div>
              </div>
            )}

            <Tabs defaultValue="queue" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-zinc-900/80">
                <TabsTrigger value="queue">Queue</TabsTrigger>
                <TabsTrigger value="room">Room</TabsTrigger>
              </TabsList>

              <TabsContent value="queue" className="mt-4">
                <div>
                  <div className="mb-3 flex items-center justify-between px-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                    <span>Upcoming tracks</span>
                    <span>{snapshot.queue.length} items</span>
                  </div>
                  <ScrollArea className="h-[396px] pr-1">
                    <ul className="space-y-3 pr-1.5">
                    {snapshot.queue.map((track, index) => (
                      <li
                        key={track.id}
                        className="rounded-xl border border-white/10 bg-zinc-900/80 p-4 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex items-center gap-2">
                              <Badge variant="outline" className="border-white/10 bg-white/5 text-[11px] text-zinc-300">
                                #{index + 1}
                              </Badge>
                              <p className="truncate font-medium text-zinc-50">{track.title}</p>
                            </div>
                            <p className="truncate text-sm text-zinc-400">{track.artist}</p>
                          </div>
                          {isAdmin && (
                            <div className="flex shrink-0 gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => void adminSkipTo(index + 1)}
                                aria-label={`Skip to ${track.title}`}
                              >
                                <SkipForward className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => void adminRemove(index + 1)}
                                aria-label={`Remove ${track.title}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <Separator className="my-3 bg-white/10" />
                        <div className="flex items-center justify-between gap-3 text-xs text-zinc-400">
                          <span>Requested by {track.requestedBy}</span>
                          <span>{formatTime(track.durationSec)}</span>
                        </div>
                        {track.sourceUrl && (
                          <a
                            href={track.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200"
                          >
                            Open source
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </li>
                    ))}
                    </ul>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="room" className="mt-4 space-y-4">
                <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
                  <p className="text-sm text-zinc-400">Room ID</p>
                  <p className="font-medium">{snapshot.roomId}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
                  <p className="mb-2 inline-flex items-center gap-2 text-sm text-zinc-400">
                    <Users className="h-4 w-4" />
                    Active listeners
                  </p>
                  <p className="text-2xl font-semibold">{snapshot.listeners}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
                  <p className="text-sm text-zinc-400">Recent voters</p>
                  <div className="mt-3 flex -space-x-2">
                    {recentUsers.map((name) => (
                      <Avatar key={name} className="border border-zinc-700">
                        <AvatarImage src="" alt={name} />
                        <AvatarFallback className="bg-zinc-800 text-xs text-zinc-200">
                          {name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="border-white/10 bg-zinc-950 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Admin Login</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Use the credentials from the bot&apos;s .env file to unlock admin-only commands.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-3" onSubmit={handleLogin}>
            <div className="grid gap-2">
              <label className="text-sm text-zinc-300" htmlFor="admin-username">
                Username
              </label>
              <Input
                id="admin-username"
                value={adminUsername}
                onChange={(event) => setAdminUsername(event.target.value)}
                autoComplete="username"
                className="border-white/15 bg-zinc-900/80"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm text-zinc-300" htmlFor="admin-password">
                Password
              </label>
              <Input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(event) => setAdminPassword(event.target.value)}
                autoComplete="current-password"
                className="border-white/15 bg-zinc-900/80"
              />
            </div>

            {loginError && <p className="text-sm text-rose-300">{loginError}</p>}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setLoginOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loginBusy}>
                {loginBusy ? 'Logging in...' : 'Login'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingUrl !== null} onOpenChange={(open) => (!open ? setPendingUrl(null) : undefined)}>
        <DialogContent className="border-white/10 bg-zinc-950 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Add This YouTube Link To Queue?</DialogTitle>
            <DialogDescription className="text-zinc-400">
              This will enqueue the selected track on the bot.
            </DialogDescription>
          </DialogHeader>

          <p className="break-all rounded-lg border border-white/10 bg-zinc-900/70 p-3 text-xs text-zinc-300">
            {pendingUrl}
          </p>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingUrl(null)}>
              Cancel
            </Button>
            <Button onClick={() => void handleConfirmAdd()} disabled={isQueueing}>
              {isQueueing ? 'Adding...' : 'Add To Queue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={youtubeKeyOpen} onOpenChange={setYoutubeKeyOpen}>
        <DialogContent className="border-white/10 bg-zinc-950 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Set Your YouTube API Key</DialogTitle>
            <DialogDescription className="text-zinc-400">
              This key is saved only in your browser local storage.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-3" onSubmit={handleSaveYouTubeKey}>
            <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-3 text-xs text-zinc-300">
              <p className="font-medium text-zinc-100">Google Cloud quick setup</p>
              <p className="mt-2">1. Create or choose a project in Google Cloud Console.</p>
              <p>2. Enable YouTube Data API v3.</p>
              <p>3. Create an API key under Credentials.</p>
              <p>4. Set Application restrictions to HTTP referrers and paste the values below.</p>
              <p>5. Set API restrictions to Restrict key and choose YouTube Data API v3.</p>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-zinc-300" htmlFor="youtube-referrers-value">
                  HTTP referrers (website restrictions)
                </label>
                <Button type="button" variant="ghost" size="sm" onClick={() => void copyToClipboard(referrerListValue)}>
                  Copy
                </Button>
              </div>
              <textarea
                id="youtube-referrers-value"
                value={referrerListValue}
                readOnly
                rows={4}
                className="rounded-md border border-white/15 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-200"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-zinc-300" htmlFor="youtube-api-restriction-value">
                  API restriction value
                </label>
                <Button type="button" variant="ghost" size="sm" onClick={() => void copyToClipboard(apiRestrictionValue)}>
                  Copy
                </Button>
              </div>
              <Input id="youtube-api-restriction-value" value={apiRestrictionValue} readOnly className="border-white/15 bg-zinc-900/80" />
            </div>

            <div className="grid gap-2">
              <label className="text-sm text-zinc-300" htmlFor="youtube-api-key">
                YouTube Data API v3 key
              </label>
              <Input
                id="youtube-api-key"
                value={youtubeKeyInput}
                onChange={(event) => setYoutubeKeyInput(event.target.value)}
                autoComplete="off"
                placeholder="AIza..."
                className="border-white/15 bg-zinc-900/80"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="justify-start border-white/15"
              onClick={() => window.open(youtubeApiPortalUrl, '_blank', 'noopener,noreferrer')}
            >
              Open Google Cloud Credentials page
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Button>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setYoutubeKeyOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save key</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default App
