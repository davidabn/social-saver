import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
import type {
  GenerateSlidesResponse,
  SearchImagesResponse,
  GeneratedSlide,
  ImageSearchResult
} from '@/types/carousel'

import { API_URL } from '@/config'

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
  templateId?: string  // Para selecionar modelo de imagem padrao
  model?: 'flux-2/pro-text-to-image' | 'gpt-image/1.5-text-to-image' | 'nano-banana-pro'
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
      templateId: input.templateId,
      model: input.model
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

  let fileToUpload = file

  // Client-side compression to stay within Cloudinary 10MB limit
  if (file.size > 1.5 * 1024 * 1024) { // Compress if > 1.5MB
    const options = {
      maxSizeMB: 8, // Target 8MB to stay safely under 10MB
      maxWidthOrHeight: 2560,
      useWebWorker: true
    }
    try {
      const compressedFile = await imageCompression(file, options)
      fileToUpload = new File([compressedFile], file.name, { type: file.type })
    } catch (error) {
      console.warn('[Upload] Compression failed, using original:', error)
    }
  }

  const formData = new FormData()
  formData.append('image', fileToUpload)

  const response = await fetch(`${API_URL}/carousel/upload-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
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

// Fetch user images
export interface UserImage {
  id: string
  url: string
  type: 'upload' | 'generated'
  created_at: string
  metadata: any
}

async function fetchUserImages(): Promise<UserImage[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/carousel/images`, {
    headers
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch images')
  }

  return response.json()
}

// Fetch Cloudinary storage usage
async function fetchStorageUsage(): Promise<any> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/carousel/storage-usage`, {
    headers
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch storage usage')
  }

  return response.json()
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
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-images'] })
      queryClient.invalidateQueries({ queryKey: ['storage-usage'] })
    }
  })
}

export function useGenerateImagePrompts() {
  return useMutation({
    mutationFn: generateImagePrompts
  })
}

export function useGenerateAIImages() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: generateAIImages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-images'] })
      queryClient.invalidateQueries({ queryKey: ['storage-usage'] })
    }
  })
}

export function useUserImages() {
  return useQuery({
    queryKey: ['user-images'],
    queryFn: fetchUserImages
  })
}

export function useStorageUsage() {
  return useQuery({
    queryKey: ['storage-usage'],
    queryFn: fetchStorageUsage,
    refetchInterval: 60000 // Refetch every minute
  })
}
