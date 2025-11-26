import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const API_URL = 'http://localhost:3001/api'

export interface WebhookToken {
  id: string
  user_id: string
  token: string
  name: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
  updated_at: string
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

// Fetch webhooks
async function fetchWebhooks(): Promise<WebhookToken[]> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/webhook`, { headers })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch webhooks')
  }

  return response.json()
}

// Create webhook
async function createWebhook(name: string = 'Default'): Promise<WebhookToken> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/webhook`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create webhook')
  }

  return response.json()
}

// Delete webhook
async function deleteWebhook(id: string): Promise<void> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/webhook/${id}`, {
    method: 'DELETE',
    headers
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete webhook')
  }
}

// Regenerate webhook token
async function regenerateWebhook(id: string): Promise<WebhookToken> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/webhook/${id}/regenerate`, {
    method: 'POST',
    headers
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to regenerate webhook')
  }

  return response.json()
}

// Hooks
export function useWebhooks() {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: fetchWebhooks
  })
}

export function useCreateWebhook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    }
  })
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    }
  })
}

export function useRegenerateWebhook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: regenerateWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    }
  })
}

// Helper to get webhook URL
export function getWebhookUrl(token: string): string {
  return `${API_URL}/webhook/${token}`
}
