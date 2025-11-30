import { Router } from 'express';
import axios from 'axios';
const router = Router();
// GET /api/proxy/image?url=...
router.get('/image', async (req, res) => {
    try {
        const imageUrl = req.query.url;
        console.log('[Proxy] Request received for URL:', imageUrl?.substring(0, 100) + '...');
        if (!imageUrl) {
            console.log('[Proxy] Error: No URL provided');
            res.status(400).json({ message: 'URL parameter is required' });
            return;
        }
        // Validate URL is from Instagram CDN
        const url = new URL(imageUrl);
        const isInstagramCDN = url.hostname.endsWith('cdninstagram.com') ||
            url.hostname.includes('instagram.com');
        console.log('[Proxy] Hostname:', url.hostname, 'Allowed:', isInstagramCDN);
        if (!isInstagramCDN) {
            console.log('[Proxy] Error: URL not allowed');
            res.status(403).json({ message: 'URL not allowed' });
            return;
        }
        // Fetch the image/video
        console.log('[Proxy] Fetching media...');
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,video/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.instagram.com/'
            }
        });
        console.log('[Proxy] Media fetched successfully, size:', response.data.length, 'bytes');
        // Get content type from response
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        console.log('[Proxy] Content-Type:', contentType);
        // Set caching headers (cache for 1 hour)
        // Cross-Origin-Resource-Policy: cross-origin allows the image to be loaded from different origins
        res.set({
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin'
        });
        res.send(Buffer.from(response.data));
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('[Proxy] Axios error:', error.response?.status, error.message);
        }
        else {
            console.error('[Proxy] Error fetching media:', error);
        }
        res.status(500).json({ message: 'Failed to fetch media' });
    }
});
export default router;
//# sourceMappingURL=proxy.routes.js.map