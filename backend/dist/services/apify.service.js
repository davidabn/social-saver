import axios from 'axios';
const APIFY_API_URL = 'https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items';
const APIFY_API_KEY = process.env.APIFY_API_KEY;
if (!APIFY_API_KEY) {
    console.warn('[Apify] Warning: APIFY_API_KEY not set');
}
function mapContentType(apifyType) {
    switch (apifyType?.toLowerCase()) {
        case 'video':
            return 'reel';
        case 'sidecar':
            return 'carousel';
        case 'image':
        default:
            return 'post';
    }
}
function extractCarouselMedia(post) {
    if (!post.childPosts || post.childPosts.length === 0)
        return null;
    console.log(`[Apify] Processing ${post.childPosts.length} child posts for carousel...`);
    return post.childPosts.map((child, index) => {
        // Prefer videoUrl (camelCase), fallback to video_url (snake_case)
        const videoUrl = child.videoUrl || child.video_url;
        // Determine if it's a video based on type or presence of a video URL
        const isVideo = child.type?.toLowerCase() === 'video' || !!videoUrl;
        console.log(`[Apify] Child ${index}: Type='${child.type}', videoUrl='${child.videoUrl}', video_url='${child.video_url}', isVideo=${isVideo}`);
        return {
            type: isVideo ? 'video' : 'image',
            url: (isVideo && videoUrl) ? videoUrl : child.displayUrl,
            thumbnail: isVideo ? child.displayUrl : undefined
        };
    });
}
function extractImageUrls(post) {
    const images = [];
    // Main display URL
    if (post.displayUrl) {
        images.push(post.displayUrl);
    }
    // Images array
    if (post.images && post.images.length > 0) {
        images.push(...post.images);
    }
    // Child posts (carousel)
    if (post.childPosts && post.childPosts.length > 0) {
        for (const child of post.childPosts) {
            if (child.displayUrl) {
                images.push(child.displayUrl);
            }
        }
    }
    // Remove duplicates
    const uniqueImages = [...new Set(images)];
    return uniqueImages.length > 0 ? uniqueImages : null;
}
export async function scrapeInstagramPost(instagramUrl) {
    if (!APIFY_API_KEY) {
        throw new Error('APIFY_API_KEY is not configured');
    }
    console.log(`[Apify] Scraping URL: ${instagramUrl}`);
    try {
        const response = await axios.post(APIFY_API_URL, {
            directUrls: [instagramUrl],
            resultsType: 'posts',
            resultsLimit: 1
        }, {
            headers: {
                'Authorization': `Bearer ${APIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 120000 // 2 minutes timeout
        });
        const posts = response.data;
        if (!posts || posts.length === 0) {
            throw new Error('No data returned from Instagram scraper');
        }
        const post = posts[0];
        console.log(`[Apify] Successfully scraped post: ${post.shortCode}`);
        console.log(`[Apify] Display URL: ${post.displayUrl}`);
        console.log(`[Apify] Type: ${post.type}`);
        console.log(`[Apify] Video URL: ${post.videoUrl || 'N/A'}`);
        console.log('[Apify] Child Posts (JSON):', JSON.stringify(post.childPosts, null, 2)); // Debugging log
        // Map to our format
        const scrapedData = {
            post_id: post.shortCode || post.id,
            content_type: mapContentType(post.type),
            author_username: post.ownerUsername,
            author_name: post.ownerFullName || null,
            author_profile_pic: post.ownerProfilePicUrl || null,
            author_verified: post.isVerified || false,
            caption: post.caption || null,
            thumbnail_url: post.displayUrl || null,
            video_url: post.videoUrl || null,
            image_urls: extractImageUrls(post),
            carousel_media: extractCarouselMedia(post),
            likes_count: post.likesCount || 0,
            comments_count: post.commentsCount || 0,
            views_count: post.videoViewCount || null,
            plays_count: post.videoPlayCount || null,
            posted_at: post.timestamp || null
        };
        return scrapedData;
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('[Apify] API Error:', error.response?.status, error.response?.data);
            if (error.response?.status === 402) {
                throw new Error('Apify credits exhausted. Please add more credits to your account.');
            }
            if (error.response?.status === 401) {
                throw new Error('Invalid Apify API key');
            }
            throw new Error(`Failed to scrape Instagram post: ${error.message}`);
        }
        throw error;
    }
}
//# sourceMappingURL=apify.service.js.map