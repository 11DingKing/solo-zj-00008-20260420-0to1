interface Song {
  id: number
  name: string
  artist: string
  album: string
  duration: number
  cover_url: string
  audio_file_url: string
}

interface Playlist {
  id: number
  name: string
  description: string
  is_public: boolean
  owner_id: number
  song_count?: number
}

interface PlaylistSongDetail {
  song_id: number
  name: string
  artist: string
  duration: number
  position: number
}

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

const useApi = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBase

  const request = async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      const data = await response.json() as ApiResponse<T>
      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  const get = <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' })
  
  const post = <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })

  const put = <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    })

  const del = <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' })

  return { get, post, put, del }
}

export const useSongsApi = () => {
  const { get, post, put, del } = useApi()

  return {
    list: (search?: string) => 
      get<Song[]>(search ? `/songs?search=${encodeURIComponent(search)}` : '/songs'),
    get: (id: number) => get<Song>(`/songs/${id}`),
    create: (song: Omit<Song, 'id'>) => post<{ id: number }>('/songs', song),
    update: (id: number, song: Omit<Song, 'id'>) => put<void>(`/songs/${id}`, song),
    delete: (id: number) => del<void>(`/songs/${id}`),
  }
}

export const usePlaylistsApi = () => {
  const { get, post, put, del } = useApi()

  return {
    getMy: () => get<Playlist[]>('/playlists/my'),
    getPopular: () => get<Playlist[]>('/playlists/popular'),
    get: (id: number) => get<Playlist>(`/playlists/${id}`),
    getSongs: (id: number) => 
      get<{ songs: PlaylistSongDetail[]; total_duration: number }>(`/playlists/${id}/songs`),
    create: (playlist: { name: string; description: string; is_public: boolean }) =>
      post<{ id: number }>('/playlists', playlist),
    update: (id: number, playlist: { name: string; description: string; is_public: boolean }) =>
      put<void>(`/playlists/${id}`, playlist),
    delete: (id: number) => del<void>(`/playlists/${id}`),
    addSong: (playlistId: number, songId: number) =>
      post<void>(`/playlists/${playlistId}/songs`, { song_id: songId }),
    removeSong: (playlistId: number, songId: number) =>
      del<void>(`/playlists/${playlistId}/songs/${songId}`),
    updatePositions: (playlistId: number, positions: { song_id: number; position: number }[]) =>
      put<void>(`/playlists/${playlistId}/positions`, positions),
    copy: (id: number) => post<{ id: number }>(`/playlists/${id}/copy`, {}),
  }
}

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
