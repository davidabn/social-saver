import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  GenerateSlidesResponse,
  SearchImagesResponse,
  GeneratedSlide,
  ImageSearchResult
} from '@/types/carousel'

const API_URL = 'http://localhost:3001/api'

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  }
}

// Generate carousel slides with AI
interface GenerateSlidesInput {
  topic: string
  slideCount?: number
  contentId?: string
}

async function generateSlides(input: GenerateSlidesInput): Promise<GeneratedSlide[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/carousel/generate-slides`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      topic: input.topic,
      slideCount: input.slideCount || 5,
      contentId: input.contentId
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to generate slides')
  }

  const data: GenerateSlidesResponse = await response.json()
  return data.slides
}

// Generate carousel slides WITH images in one call
async function generateSlidesWithImages(input: GenerateSlidesInput): Promise<GeneratedSlide[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/carousel/generate-slides-with-images`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      topic: input.topic,
      slideCount: input.slideCount || 5,
      contentId: input.contentId
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to generate slides')
  }

  const data: GenerateSlidesResponse = await response.json()
  return data.slides
}

// Search images via Perplexity
interface SearchImagesInput {
  query: string
  count?: number
}

async function searchImages(input: SearchImagesInput): Promise<ImageSearchResult[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/carousel/search-images`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: input.query,
      count: input.count || 5
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to search images')
  }

  const data: SearchImagesResponse = await response.json()
  return data.images
}

// Search images for a specific slide
interface SearchImagesForSlideInput {
  headline: string
  body?: string
  theme: string
}

async function searchImagesForSlide(input: SearchImagesForSlideInput): Promise<ImageSearchResult[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/carousel/search-images-for-slide`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to search images')
  }

  const data: SearchImagesResponse = await response.json()
  return data.images
}

// Hooks
export function useGenerateSlides() {
  return useMutation({
    mutationFn: generateSlides
  })
}

export function useGenerateSlidesWithImages() {
  return useMutation({
    mutationFn: generateSlidesWithImages
  })
}

export function useSearchImages() {
  return useMutation({
    mutationFn: searchImages
  })
}

export function useSearchImagesForSlide() {
  return useMutation({
    mutationFn: searchImagesForSlide
  })
}
