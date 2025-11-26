import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { SavedContent, PaginatedResponse } from '@/types'

const API_URL = 'http://localhost:3001/api'

export interface ContentFilters {
  page?: number
  limit?: number
  search?: string
  dateFrom?: string
  dateTo?: string
  filter?: 'all' | 'reel' | 'post' | 'carousel'
}

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

// Fetch contents with filters
async function fetchContents(filters: ContentFilters = {}): Promise<PaginatedResponse<SavedContent>> {
  const { page = 1, limit = 20, search, dateFrom, dateTo, filter } = filters
  const headers = await getAuthHeaders()

  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('limit', limit.toString())
  if (search) params.append('search', search)
  if (dateFrom) params.append('date_from', dateFrom)
  if (dateTo) params.append('date_to', dateTo)
  if (filter && filter !== 'all') params.append('filter', filter)

  const response = await fetch(`${API_URL}/contents?${params.toString()}`, { headers })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch contents')
  }

  return response.json()
}

// Create content
async function createContent(instagramUrl: string): Promise<SavedContent> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/contents`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ instagram_url: instagramUrl })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to save content')
  }

  return response.json()
}

// Delete content
async function deleteContent(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/contents/${id}`, {
    method: 'DELETE',
    headers
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete content')
  }
}

// Hooks
export function useContents(filters: ContentFilters = {}) {
  return useQuery({
    queryKey: ['contents', filters],
    queryFn: () => fetchContents(filters),
  })
}

export function useCreateContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] })
    }
  })
}

export function useDeleteContent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contents'] })
    }
  })
}
