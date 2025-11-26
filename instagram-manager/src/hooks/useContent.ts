import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ContentWithTranscription } from '@/types'

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

async function fetchContentById(contentId: string): Promise<ContentWithTranscription> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/contents/${contentId}`, { headers })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch content')
  }

  return response.json()
}

export function useContent(contentId: string | null) {
  return useQuery({
    queryKey: ['content', contentId],
    queryFn: () => fetchContentById(contentId!),
    enabled: !!contentId
  })
}
