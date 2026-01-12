// Content types
export type ContentType = 'reel' | 'post' | 'carousel'
export type Platform = 'instagram' | 'tiktok' | 'youtube'
export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface CarouselMedia {
  type: 'image' | 'video'
  url: string
  thumbnail?: string
}

// Database types
export interface SavedContent {
  id: string
  user_id: string
  instagram_url: string
  post_id: string
  platform: Platform
  content_type: ContentType
  author_username: string
  author_name: string | null
  author_profile_pic: string | null
  author_verified: boolean
  caption: string | null
  thumbnail_url: string | null
  video_url: string | null
  image_urls: string[] | null
  carousel_media: CarouselMedia[] | null
  likes_count: number
  comments_count: number
  views_count: number | null
  plays_count: number | null
  posted_at: string | null
  saved_at: string
  is_processed: boolean
  transcription_status: TranscriptionStatus
  collection_id: string | null
  generated_script: string | null
  created_at: string
  updated_at: string
}

// Collection types
export interface Collection {
  id: string
  user_id: string
  name: string
  description: string | null
  cover_image_url: string | null
  created_at: string
  updated_at: string
}

export interface CollectionWithCount extends Collection {
  content_count: number
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

// AI Types
export interface Persona {
  niche: string
  targetAudience: string
  toneOfVoice: string
  contentPillars?: string
  additionalContext?: string
  // Profile branding fields (for carousel first slide)
  displayName?: string        // "David Facundo"
  username?: string           // "davidabn_" (without @)
  avatarUrl?: string          // Profile photo URL
  isVerified?: boolean        // Show blue checkmark
}

export interface GenerateContentInput {
  contentId: string
  type: 'reel' | 'post' | 'carousel'
  instructions?: string
}

// Feed Types
export interface MonitoredProfile {
  id: string
  user_id: string
  username: string
  platform: Platform
  avatar_url: string | null
  full_name: string | null
  last_checked_at: string | null
  created_at: string
}

export interface FeedItem {
  id: string
  user_id: string
  profile_id: string
  post_id: string
  platform: Platform
  content_type: ContentType
  thumbnail_url: string | null
  video_url: string | null
  image_urls: string[] | null
  carousel_media: CarouselMedia[] | null
  caption: string | null
  likes_count: number
  comments_count: number
  posted_at: string | null
  is_saved: boolean
  created_at: string
  profile?: {
    username: string
    avatar_url: string | null
  }
}
