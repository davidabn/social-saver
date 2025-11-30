import type { ContentType } from '../types/index.js';
export interface CarouselMedia {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
}
export interface ScrapedInstagramData {
    post_id: string;
    content_type: ContentType;
    author_username: string;
    author_name: string | null;
    author_profile_pic: string | null;
    author_verified: boolean;
    caption: string | null;
    thumbnail_url: string | null;
    video_url: string | null;
    image_urls: string[] | null;
    carousel_media: CarouselMedia[] | null;
    likes_count: number;
    comments_count: number;
    views_count: number | null;
    plays_count: number | null;
    posted_at: string | null;
}
export declare function scrapeInstagramPost(instagramUrl: string): Promise<ScrapedInstagramData>;
//# sourceMappingURL=apify.service.d.ts.map