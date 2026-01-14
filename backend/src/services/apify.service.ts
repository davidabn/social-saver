import axios from 'axios'
import type { ContentType } from '../types/index.js'

const APIFY_API_URL = 'https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items'
const APIFY_API_KEY = process.env.APIFY_API_KEY

if (!APIFY_API_KEY) {
  console.warn('[Apify] Warning: APIFY_API_KEY not set')
}

// Apify response types
interface ApifyImageResource {
  src: string
  config_width: number
  config_height: number
}

interface ApifyInstagramPost {
  id: string
  shortCode: string
  url: string
  type: string // 'Image' | 'Video' | 'Sidecar'
  caption?: string
  timestamp: string
  likesCount: number
  commentsCount: number
  videoViewCount?: number
  videoPlayCount?: number
  displayUrl: string
  displayResources?: ApifyImageResource[]
  videoUrl?: string
  images?: string[]
  ownerUsername: string
  ownerFullName?: string
  ownerId: string
  ownerProfilePicUrl?: string
  isVerified?: boolean
  childPosts?: Array<{
    type: string
    displayUrl: string
    displayResources?: ApifyImageResource[]
    videoUrl?: string
    video_url?: string // Added for robustness based on log analysis
  }>
}

// Our normalized format
export interface CarouselMedia {
  type: 'image' | 'video'
  url: string
  thumbnail?: string
}

export interface ScrapedInstagramData {
  post_id: string
  platform: 'instagram' | 'youtube' | 'tiktok'
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
  transcription?: string
}

function mapContentType(apifyType: string): ContentType {
  switch (apifyType?.toLowerCase()) {
    case 'video':
      return 'reel'
    case 'sidecar':
      return 'carousel'
    case 'image':
    default:
      return 'post'
  }
}

function getBestImageUrl(item: { displayUrl: string; displayResources?: ApifyImageResource[] }): string {
  if (item.displayResources && item.displayResources.length > 0) {
    // Find the resource with the largest width
    const bestResource = item.displayResources.reduce((prev, current) => {
      return (prev.config_width > current.config_width) ? prev : current
    })
    return bestResource.src
  }
  return item.displayUrl
}

function extractCarouselMedia(post: ApifyInstagramPost): CarouselMedia[] | null {
  if (!post.childPosts || post.childPosts.length === 0) return null

  console.log(`[Apify] Processing ${post.childPosts.length} child posts for carousel...`)

  return post.childPosts.map((child, index) => {
    // Prefer videoUrl (camelCase), fallback to video_url (snake_case)
    const videoUrl = child.videoUrl || child.video_url

    // Determine if it's a video based on type or presence of a video URL
    const isVideo = child.type?.toLowerCase() === 'video' || !!videoUrl

    console.log(`[Apify] Child ${index}: Type='${child.type}', videoUrl='${child.videoUrl}', video_url='${child.video_url}', isVideo=${isVideo}`)

    const bestImageUrl = getBestImageUrl(child)

    return {
      type: isVideo ? 'video' : 'image',
      url: (isVideo && videoUrl) ? videoUrl : bestImageUrl,
      thumbnail: isVideo ? bestImageUrl : undefined
    }
  })
}

function extractImageUrls(post: ApifyInstagramPost): string[] | null {
  const images: string[] = []

  // Main display URL (best quality)
  images.push(getBestImageUrl(post))

  // Child posts (carousel)
  if (post.childPosts && post.childPosts.length > 0) {
    for (const child of post.childPosts) {
      images.push(getBestImageUrl(child))
    }
  } else if (post.images && post.images.length > 0 && !post.displayResources) {
    // Fallback: if no childPosts and no displayResources, but we have images array, use it.
    images.push(...post.images)
  }

  // Remove duplicates
  const uniqueImages = [...new Set(images)]
  return uniqueImages.length > 0 ? uniqueImages : null
}

// Scrape posts from a profile by username
export async function scrapeInstagramProfilePosts(username: string, limit: number = 5): Promise<Array<{
  post_id: string
  platform: string
  content_type: ContentType
  thumbnail_url: string | null
  video_url: string | null
  image_urls: string[] | null
  carousel_media: CarouselMedia[] | null
  caption: string | null
  likes_count: number
  comments_count: number
  posted_at: string | null
  author_profile_pic: string | null
  author_name: string | null
}>> {
  if (!APIFY_API_KEY) {
    throw new Error('APIFY_API_KEY is not configured')
  }

  console.log(`[Apify] Scraping profile: ${username} (limit: ${limit})`)

  try {
    const response = await axios.post<ApifyInstagramPost[]>(
      APIFY_API_URL,
      {
        usernames: [username],
        resultsType: 'posts',
        resultsLimit: limit
      },
      {
        headers: {
          'Authorization': `Bearer ${APIFY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    )

    const posts = response.data

    if (!posts || posts.length === 0) {
      console.log(`[Apify] No posts found for profile: ${username}`)
      return []
    }

    console.log(`[Apify] Found ${posts.length} posts for ${username}`)

    return posts.map(post => ({
      post_id: post.shortCode || post.id,
      platform: 'instagram',
      content_type: mapContentType(post.type),
      thumbnail_url: getBestImageUrl(post) || null,
      video_url: post.videoUrl || null,
      image_urls: extractImageUrls(post),
      carousel_media: extractCarouselMedia(post),
      caption: post.caption || null,
      likes_count: post.likesCount || 0,
      comments_count: post.commentsCount || 0,
      posted_at: post.timestamp || null,
      author_profile_pic: post.ownerProfilePicUrl || null,
      author_name: post.ownerFullName || null
    }))
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[Apify] Profile Scrape Error:', error.response?.status, error.response?.data)
      throw new Error(`Failed to scrape profile: ${error.message}`)
    }
    throw error
  }
}

export async function scrapeInstagramPost(instagramUrl: string): Promise<ScrapedInstagramData> {
  if (!APIFY_API_KEY) {
    throw new Error('APIFY_API_KEY is not configured')
  }

  console.log(`[Apify] Scraping URL: ${instagramUrl}`)

  try {
    const response = await axios.post<ApifyInstagramPost[]>(
      APIFY_API_URL,
      {
        directUrls: [instagramUrl],
        resultsType: 'posts',
        resultsLimit: 1
      },
      {
        headers: {
          'Authorization': `Bearer ${APIFY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2 minutes timeout
      }
    )

    const posts = response.data

    if (!posts || posts.length === 0) {
      throw new Error('No data returned from Instagram scraper')
    }

    const post = posts[0]!

    console.log(`[Apify] Successfully scraped post: ${post.shortCode}`)

    // Map to our format
    const scrapedData: ScrapedInstagramData = {
      post_id: post.shortCode || post.id,
      platform: 'instagram',
      content_type: mapContentType(post.type),
      author_username: post.ownerUsername,
      author_name: post.ownerFullName || null,
      author_profile_pic: post.ownerProfilePicUrl || null,
      author_verified: post.isVerified || false,
      caption: post.caption || null,
      thumbnail_url: getBestImageUrl(post) || null,
      video_url: post.videoUrl || null,
      image_urls: extractImageUrls(post),
      carousel_media: extractCarouselMedia(post),
      likes_count: post.likesCount || 0,
      comments_count: post.commentsCount || 0,
      views_count: post.videoViewCount || null,
      plays_count: post.videoPlayCount || null,
      posted_at: post.timestamp || null
    }

    return scrapedData
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[Apify] API Error:', error.response?.status, error.response?.data)

      if (error.response?.status === 402) {
        throw new Error('Apify credits exhausted. Please add more credits to your account.')
      }

      if (error.response?.status === 401) {
        throw new Error('Invalid Apify API key')
      }

      throw new Error(`Failed to scrape Instagram post: ${error.message}`)
    }

    throw error
  }
}

export async function scrapeYouTubeVideo(youtubeUrl: string): Promise<ScrapedInstagramData & { transcription?: string }> {
  if (!APIFY_API_KEY) {
    throw new Error('APIFY_API_KEY is not configured')
  }

  console.log(`[YouTube] Scraping via Apify Actor: streamers/youtube-scraper for ${youtubeUrl}`)

  try {
    const response = await axios.post(
      'https://api.apify.com/v2/acts/streamers~youtube-scraper/run-sync-get-dataset-items',
      {
        downloadSubtitles: true,
        hasCC: false,
        hasLocation: false,
        hasSubtitles: false,
        is360: false,
        is3D: false,
        is4K: false,
        isBought: false,
        isHD: false,
        isHDR: false,
        isLive: false,
        isVR180: false,
        maxResultStreams: 0,
        maxResults: 1,
        maxResultsShorts: 0,
        preferAutoGeneratedSubtitles: false,
        saveSubsToKVS: false,
        startUrls: [
          { url: youtubeUrl }
        ],
        subtitlesFormat: "srt",
        subtitlesLanguage: "en"
      },
      {
        headers: {
          'Authorization': `Bearer ${APIFY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 180000 // 3 minutes
      }
    )

    const videos = response.data

    if (!videos || videos.length === 0) {
      throw new Error('No data returned from YouTube scraper actor')
    }

    const video = videos[0]

    // streamers/youtube-scraper returns subtitles in subtitles[0].srt
    let transcription = ''
    if (video.subtitles && Array.isArray(video.subtitles) && video.subtitles.length > 0) {
      const sub = video.subtitles[0]
      if (sub.srt) {
        // Parse SRT blocks
        const blocks = sub.srt.split(/\n\s*\n/)
        const segments: Array<{ time: string, seconds: number, text: string }> = []

        blocks.forEach((block: string) => {
          const lines = block.trim().split('\n')
          if (lines.length < 3) return

          // Match timestamps (handles the actor's format like 00:00:0,320)
          const timeMatch = lines[1].match(/(\d+):(\d+):(\d+),(\d+)/)
          if (!timeMatch) return

          const h = parseInt(timeMatch[1]), m = parseInt(timeMatch[2]), s = parseInt(timeMatch[3])
          const totalSeconds = h * 3600 + m * 60 + s
          const timestamp = h > 0
            ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`

          const text = lines.slice(2).join(' ').trim()
          if (text && text !== ' ') {
            segments.push({ time: timestamp, seconds: totalSeconds, text })
          }
        })

        // Group segments into paragraphs every ~30 seconds (Glasp style)
        let groupedText = ''
        let lastTimeMark = -999

        segments.forEach((seg, index) => {
          if (index === 0 || seg.seconds >= lastTimeMark + 30) {
            groupedText += (index === 0 ? '' : '\n\n') + `**${seg.time}**  ${seg.text}`
            lastTimeMark = seg.seconds
          } else {
            groupedText += ' ' + seg.text
          }
        })

        transcription = groupedText.trim()
        console.log(`[YouTube] Glasp-style transcription generated: ${transcription.length} chars`)
      }
    }

    return {
      post_id: video.id || video.videoId,
      platform: 'youtube',
      content_type: 'reel',
      author_username: video.channelUsername || video.channelId || 'youtube',
      author_name: video.channelName || video.author || null,
      author_profile_pic: video.authorThumbnails?.[0]?.url || null,
      author_verified: false,
      caption: video.title + "\n\n" + (video.text || video.description || ''),
      thumbnail_url: video.thumbnailUrl || video.thumbnails?.[0]?.url || null,
      video_url: youtubeUrl,
      image_urls: null,
      carousel_media: null,
      likes_count: video.likes || 0,
      comments_count: video.commentsCount || 0,
      views_count: video.viewCount || null,
      plays_count: null,
      posted_at: video.date || new Date().toISOString(),
      transcription: transcription || undefined
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[Apify] YouTube Actor Error:', error.response?.status, error.response?.data)
      throw new Error(`YouTube Actor failed: ${error.message}`)
    }
    throw error
  }
}

export async function scrapeTikTokVideo(tiktokUrl: string): Promise<ScrapedInstagramData> {
  if (!APIFY_API_KEY) {
    throw new Error('APIFY_API_KEY is not configured')
  }

  console.log(`[TikTok] Scraping via Apify Actor: clockworks/tiktok-scraper for ${tiktokUrl}`)

  try {
    const response = await axios.post(
      'https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items',
      {
        postURLs: [tiktokUrl],
        excludePinnedPosts: false,
        maxRepliesPerComment: 0,
        proxyCountryCode: "None",
        resultsPerPage: 1, // keeping 1 for efficiency as we want specific video
        scrapeRelatedVideos: false,
        shouldDownloadAvatars: false,
        shouldDownloadCovers: true,
        shouldDownloadMusicCovers: false,
        shouldDownloadSlideshowImages: false,
        shouldDownloadSubtitles: false,
        shouldDownloadVideos: true,
        profileScrapeSections: ["videos"],
        profileSorting: "latest",
        searchSection: "",
        maxProfilesPerQuery: 10,
        searchSorting: "0",
        searchDatePosted: "0"
      },
      {
        headers: {
          'Authorization': `Bearer ${APIFY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2 minutes
      }
    )

    const videos = response.data

    if (!videos || videos.length === 0) {
      throw new Error('No data returned from TikTok scraper actor')
    }

    const video = videos[0]

    // Determine content type (TikToks are usually reels/videos, sometimes slideshows)
    const isSlideshow = video.isSlideshow || (video.slideshowImages && video.slideshowImages.length > 0)

    // Map slideshow images if present
    let carouselMedia: CarouselMedia[] | null = null
    let imageUrls: string[] | null = null

    if (isSlideshow && video.slideshowImages) {
      imageUrls = video.slideshowImages.map((img: any) => img.url)
      carouselMedia = video.slideshowImages.map((img: any) => ({
        type: 'image',
        url: img.url
      }))
    }

    // Try to extract subtitles/transcription if available from the scraper
    let transcription = '';
    if (video.subtitles && Array.isArray(video.subtitles) && video.subtitles.length > 0) {
      // Try to find the first subtitle that has text or srt
      const sub = video.subtitles.find((s: any) => s && (s.srt || s.text));
      if (sub) {
        transcription = sub.srt || sub.text || '';
      }
    }

    // Try to find video URL in multiple places
    const videoUrl = video.videoUrl ||
      video.videoMeta?.downloadAddr ||
      video.videoMeta?.playAddr ||
      video.downloadAddr ||
      video.playAddr ||
      null;

    return {
      post_id: video.id,
      platform: 'tiktok',
      content_type: isSlideshow ? 'carousel' : 'reel',
      author_username: video.authorMeta?.name || 'tiktok_user',
      author_name: video.authorMeta?.nickName || null,
      author_profile_pic: video.authorMeta?.avatar || null,
      author_verified: video.authorMeta?.verified || false,
      caption: video.text || null,
      thumbnail_url: video.videoMeta?.coverUrl || video.imageUrl || null,
      video_url: (!isSlideshow && videoUrl) ? videoUrl : null,
      image_urls: imageUrls,
      carousel_media: carouselMedia,
      likes_count: video.diggCount || 0,
      comments_count: video.commentCount || 0,
      views_count: video.playCount || null,
      plays_count: video.playCount || null,
      posted_at: video.createTimeISO || new Date(video.createTime * 1000).toISOString(),
      transcription: transcription || undefined
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[Apify] TikTok Actor Error:', error.response?.status, error.response?.data)
      throw new Error(`TikTok Actor failed: ${error.message}`)
    }
    throw error
  }
}