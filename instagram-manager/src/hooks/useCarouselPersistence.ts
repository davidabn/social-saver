import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CarouselDesign, CarouselSlide } from '@/types/carousel'
import type { HeaderTexts } from '@/types/template'
import type { ColorPalette } from '@/templates/palettes'

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

// Tipo dos dados salvos
export interface CarouselSaveData {
  design: CarouselDesign
  headerTexts: HeaderTexts
  templateId: string | null
  customPalette: ColorPalette
}

// Tipo do carrossel salvo retornado pela API
export interface SavedCarousel {
  id: string
  name: string
  data: CarouselSaveData
  created_at: string
  updated_at: string
}

// Tipo para listagem (com dados para thumbnail)
export interface CarouselListItem {
  id: string
  name: string
  created_at: string
  updated_at: string
  firstSlide: CarouselSlide | null
  templateId: string | null
  headerTexts: HeaderTexts | null
  customPalette: ColorPalette | null
}

/**
 * Hook para salvar carrossel (criar ou atualizar)
 */
export function useSaveCarousel() {
  return useMutation({
    mutationFn: async ({
      id,
      name,
      data
    }: {
      id?: string
      name: string
      data: CarouselSaveData
    }): Promise<SavedCarousel> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/carousel/save`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id, name, data })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to save carousel')
      }

      return response.json()
    }
  })
}

/**
 * Hook para listar carrosseis do usuário
 */
export function useCarouselList() {
  return useQuery({
    queryKey: ['carousels'],
    queryFn: async (): Promise<CarouselListItem[]> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/carousel/list`, { headers })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to list carousels')
      }

      return response.json()
    },
    staleTime: 30000 // 30 segundos
  })
}

/**
 * Hook para carregar um carrossel específico
 */
export function useCarousel(id: string | null) {
  return useQuery({
    queryKey: ['carousel', id],
    queryFn: async (): Promise<SavedCarousel | null> => {
      if (!id) return null

      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/carousel/${id}`, { headers })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to load carousel')
      }

      return response.json()
    },
    enabled: !!id,
    staleTime: 60000 // 1 minuto
  })
}

/**
 * Hook para deletar carrossel
 */
export function useDeleteCarousel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/carousel/${id}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete carousel')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carousels'] })
    }
  })
}
