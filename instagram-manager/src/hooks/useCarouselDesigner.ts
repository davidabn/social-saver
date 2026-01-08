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

// Parse script with AI
interface ParseScriptInput {
  script: string
  slideCount?: number
}

interface ParsedSlideFromAI {
  slideNumber: number
  headline: string
  body: string
  imageSearchQuery?: string
}

async function parseScriptWithAI(input: ParseScriptInput): Promise<ParsedSlideFromAI[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/carousel/parse-script`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to parse script with AI')
  }

  const data: { slides: ParsedSlideFromAI[] } = await response.json()
  return data.slides
}

// Generate image prompts with GPT-4o
interface GenerateImagePromptsInput {
  slides: { headline: string; body: string }[]
  theme: string
  templateId?: string  // Template para usar system prompt específico
}

interface ImagePrompt {
  slideIndex: number
  prompt: string
}

async function generateImagePrompts(input: GenerateImagePromptsInput): Promise<ImagePrompt[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/carousel/generate-image-prompts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      slides: input.slides,
      theme: input.theme,
      templateId: input.templateId
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to generate image prompts')
  }

  const data: { prompts: ImagePrompt[] } = await response.json()
  return data.prompts
}

// Generate AI images via Kie.ai (Flux 2 Pro or GPT Image 1.5)
interface GenerateAIImagesInput {
  prompts: { slideIndex: number; prompt: string }[]
  templateId?: string  // Para selecionar modelo de imagem
}

interface GeneratedImage {
  slideIndex: number
  imageUrl: string
}

interface GenerateAIImagesResponse {
  images: GeneratedImage[]
  errors: { slideIndex: number; error: string }[]
  successCount: number
  errorCount: number
}

async function generateAIImages(input: GenerateAIImagesInput): Promise<GenerateAIImagesResponse> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/carousel/generate-ai-images`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompts: input.prompts,
      templateId: input.templateId
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to generate AI images')
  }

  return response.json()
}

// Upload image to Supabase Storage
async function uploadImage(file: File): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch(`${API_URL}/carousel/upload-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
      // Note: Don't set Content-Type for FormData - browser sets it with boundary
    },
    body: formData
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to upload image')
  }

  const data: { url: string } = await response.json()
  return data.url
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

export function useParseScriptWithAI() {
  return useMutation({
    mutationFn: parseScriptWithAI
  })
}

export function useUploadImage() {
  return useMutation({
    mutationFn: uploadImage
  })
}

export function useGenerateImagePrompts() {
  return useMutation({
    mutationFn: generateImagePrompts
  })
}

export function useGenerateAIImages() {
  return useMutation({
    mutationFn: generateAIImages
  })
}
