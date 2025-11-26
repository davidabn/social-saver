export type ContentType = 'reel' | 'post' | 'carousel'
export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface SavedContent {
  id: string
  user_id: string
  instagram_url: string
  post_id: string
  content_type: ContentType
  author_username: string
  author_name: string | null
  author_profile_pic: string | null
  author_verified: boolean
  caption: string | null
  thumbnail_url: string | null
  video_url: string | null
  image_urls: string[] | null
  likes_count: number
  comments_count: number
  views_count: number | null
  plays_count: number | null
  posted_at: string | null
  saved_at: string
  is_processed: boolean
  transcription_status: TranscriptionStatus
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface Transcription {
  id: string
  content_id: string
  text: string
  language: string
  created_at: string
  updated_at?: string
}

export interface ContentWithTranscription extends SavedContent {
  transcription?: Transcription | null
}
