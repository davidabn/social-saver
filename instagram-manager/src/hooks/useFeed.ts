import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { FeedItem, MonitoredProfile, PaginatedResponse } from '@/types'

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

// Profiles
async function fetchProfiles(): Promise<MonitoredProfile[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/feed/profiles`, { headers })
  if (!response.ok) throw new Error('Failed to fetch profiles')
  return response.json()
}

async function addProfile(username: string): Promise<MonitoredProfile> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/feed/profiles`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ username, platform: 'instagram' })
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to add profile')
  }
  return response.json()
}

async function deleteProfile(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/feed/profiles/${id}`, {
    method: 'DELETE',
    headers
  })
  if (!response.ok) throw new Error('Failed to delete profile')
}

// Feed
async function fetchFeed(page = 1, limit = 20, profileId?: string): Promise<PaginatedResponse<FeedItem>> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })
  if (profileId) params.append('profileId', profileId)

  const response = await fetch(`${API_URL}/feed?${params.toString()}`, { headers })
  if (!response.ok) throw new Error('Failed to fetch feed')
  return response.json()
}

async function refreshFeed(): Promise<void> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/feed/refresh`, {
    method: 'POST',
    headers
  })
  if (!response.ok) throw new Error('Failed to refresh feed')
}

async function saveFeedItem(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/feed/${id}/save`, {
    method: 'POST',
    headers
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to save item')
  }
}

// Hooks
export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: fetchProfiles
  })
}

export function useAddProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    }
  })
}

export function useDeleteProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    }
  })
}

export function useFeed(page: number, profileId?: string) {
  return useQuery({
    queryKey: ['feed', page, profileId],
    queryFn: () => fetchFeed(page, 20, profileId)
  })
}

export function useRefreshFeed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: refreshFeed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['profiles'] }) // Update last checked
    }
  })
}

export function useSaveFeedItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveFeedItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    }
  })
}
