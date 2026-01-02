import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Persona, GenerateContentInput } from '@/types'

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

// Fetch Persona
async function fetchPersona(): Promise<Persona | null> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/ai/persona`, { headers })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch persona')
  }

  return response.json()
}

// Update Persona
async function updatePersona(persona: Persona): Promise<Persona> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/ai/persona`, {
    method: 'POST',
    headers,
    body: JSON.stringify(persona)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update persona')
  }

  return response.json()
}

// Generate Content
async function generateContent(input: GenerateContentInput): Promise<{ content: string }> {
  const headers = await getAuthHeaders()
  const response = await fetch(`${API_URL}/ai/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to generate content')
  }

  return response.json()
}

export function usePersona() {
  return useQuery({
    queryKey: ['persona'],
    queryFn: fetchPersona,
  })
}

export function useUpdatePersona() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updatePersona,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persona'] })
    }
  })
}

export function useGenerateContent() {
  return useMutation({
    mutationFn: generateContent,
  })
}
