import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { API_URL } from '@/config'

/**
 * Gets a proxy URL for an image, or returns the original URL if it's from a trusted CDN
 */
export function getProxyImageUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('data:')) return url
  if (url.includes('/api/proxy/')) return url

  // URLs that can be accessed directly (bypass proxy)
  const bypassHosts = [
    'unsplash.com',
    'pexels.com',
    'pixabay.com',
    'supabase.co',
    'kie.ai',
    'aiquickdraw.com',
    'replicate.delivery',
    'cloudinary.com',
    'ytimg.com',
    'ggpht.com',
    'googleusercontent.com'
  ]

  const shouldBypass = bypassHosts.some(host => url.includes(host))

  if (shouldBypass) {
    return url
  }

  return `${API_URL}/proxy/image?url=${encodeURIComponent(url)}`
}
