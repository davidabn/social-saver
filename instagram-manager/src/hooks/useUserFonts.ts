import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

import { API_URL } from '@/config'

// Tipo da fonte do usuário
export interface UserFont {
    id: string
    name: string
    family_name: string
    file_url: string
    file_format: string
    created_at: string
}

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
        throw new Error('Not authenticated')
    }
    return {
        'Authorization': `Bearer ${session.access_token}`,
    }
}

// Carregar fonte via FontFace API
export async function loadUserFont(font: UserFont): Promise<void> {
    try {
        const fontFace = new FontFace(
            font.family_name,
            `url(${font.file_url})`,
            { display: 'swap' }
        )
        await fontFace.load()
        document.fonts.add(fontFace)
        console.log(`[Fonts] Loaded custom font: ${font.name} (${font.family_name})`)
    } catch (error) {
        console.error(`[Fonts] Failed to load font ${font.name}:`, error)
    }
}

// Carregar todas as fontes do usuário
export async function loadAllUserFonts(fonts: UserFont[]): Promise<void> {
    await Promise.all(fonts.map(loadUserFont))
}

// Listar fontes do usuário
async function fetchUserFonts(): Promise<UserFont[]> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_URL}/fonts`, { headers })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch fonts')
    }

    return response.json()
}

// Upload de nova fonte
async function uploadFont(file: File): Promise<UserFont> {
    const headers = await getAuthHeaders()

    const formData = new FormData()
    formData.append('font', file)

    const response = await fetch(`${API_URL}/fonts/upload`, {
        method: 'POST',
        headers,
        body: formData
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to upload font')
    }

    return response.json()
}

// Deletar fonte
async function deleteFont(id: string): Promise<void> {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_URL}/fonts/${id}`, {
        method: 'DELETE',
        headers
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete font')
    }
}

/**
 * Hook para listar fontes do usuário
 */
export function useUserFonts() {
    return useQuery({
        queryKey: ['user-fonts'],
        queryFn: fetchUserFonts,
        staleTime: 5 * 60 * 1000 // 5 minutos
    })
}

/**
 * Hook para fazer upload de nova fonte
 */
export function useUploadFont() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: uploadFont,
        onSuccess: async (newFont) => {
            // Carregar a fonte imediatamente
            await loadUserFont(newFont)
            // Invalidar cache para recarregar lista
            queryClient.invalidateQueries({ queryKey: ['user-fonts'] })
        }
    })
}

/**
 * Hook para deletar fonte
 */
export function useDeleteFont() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: deleteFont,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-fonts'] })
        }
    })
}
