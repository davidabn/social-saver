import { Router, Request, Response } from 'express'
import axios from 'axios'

const router = Router()

// GET /api/proxy/image?url=...
router.get('/image', async (req: Request, res: Response) => {
  try {
    const imageUrl = req.query.url as string

    // console.log('[Proxy] Request received for URL:', imageUrl?.substring(0, 100) + '...')

    if (!imageUrl) {
      console.log('[Proxy] Error: No URL provided')
      res.status(400).json({ message: 'URL parameter is required' })
      return
    }

    // Validate URL is from Allowed CDN
    const url = new URL(imageUrl)
    const isAllowedCDN = url.hostname.includes('instagram.com') ||
                           url.hostname.includes('cdninstagram.com') ||
                           url.hostname.includes('fbcdn.net') ||
                           url.hostname.includes('tiktok.com') ||
                           url.hostname.includes('tiktokcdn') ||
                           url.hostname.includes('tiktokv.com') ||
                           url.hostname.includes('muscdn.com') ||
                           url.hostname.includes('byteoversea.com') ||
                           url.hostname.includes('ibyteimg.com') ||
                           url.hostname.includes('supabase.co') ||
                           url.hostname.includes('cloudinary.com') ||
                           url.hostname.includes('apify.com') ||
                           url.hostname.includes('ytimg.com') ||
                           url.hostname.includes('ggpht.com') ||
                           url.hostname.includes('googlevideo.com') ||
                           url.hostname.includes('youtube.com') ||
                           url.hostname.includes('youtu.be') ||
                           url.hostname.includes('googleusercontent.com') ||
                           url.hostname.includes('google.com')

    // console.log('[Proxy] Hostname:', url.hostname, 'Allowed:', isAllowedCDN)

    if (!isAllowedCDN) {
      console.log(`[Proxy] Error: URL not allowed - ${url.hostname}`)
      res.status(403).json({ message: 'URL not allowed' })
      return
    }

    // Fetch the image/video as a stream
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,video/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.tiktok.com/' 
      }
    })

    // Get content type from response
    const contentType = response.headers['content-type'] || 'application/octet-stream'
    const contentLength = response.headers['content-length']

    // Set headers
    const headers: Record<string, string | number | undefined> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    }

    if (contentLength) {
      headers['Content-Length'] = contentLength
    }

    res.set(headers)

    // Pipe the stream
    response.data.pipe(res)

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[Proxy] Axios error:', error.response?.status, error.message)
      // If headers were already sent (streaming started), we can't send JSON error.
      // But usually error happens before stream starts.
      if (!res.headersSent) {
         res.status(500).json({ message: 'Failed to fetch media' })
      }
    } else {
      console.error('[Proxy] Error fetching media:', error)
      if (!res.headersSent) {
         res.status(500).json({ message: 'Failed to fetch media' })
      }
    }
  }
})

export default router
