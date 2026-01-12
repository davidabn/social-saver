import type { Response, NextFunction } from 'express'
import { z } from 'zod'
import type { AuthenticatedRequest } from '../types/index.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { AppError } from '../middleware/errorHandler.js'
import { uploadToCloudinary } from '../services/cloudinary.service.js'

// Schema para validação
const deleteFontSchema = z.object({
    id: z.string().uuid()
})

// Tipos de arquivo permitidos
const ALLOWED_FONT_TYPES = [
    'font/ttf',
    'font/otf',
    'font/woff',
    'font/woff2',
    'application/x-font-ttf',
    'application/x-font-otf',
    'application/font-woff',
    'application/font-woff2',
    'application/octet-stream' // Alguns browsers enviam assim
]

const ALLOWED_EXTENSIONS = ['.ttf', '.otf', '.woff', '.woff2']

// Detectar formato da fonte pela extensão
function getFontFormat(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop()
    switch (ext) {
        case 'ttf': return 'truetype'
        case 'otf': return 'opentype'
        case 'woff': return 'woff'
        case 'woff2': return 'woff2'
        default: return 'truetype'
    }
}

// POST /api/fonts/upload - Upload de nova fonte
export async function uploadFont(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id
        if (!userId) throw new AppError('User not authenticated', 401)

        const file = req.file
        if (!file) throw new AppError('No file uploaded', 400)

        // Validar extensão do arquivo
        const filename = file.originalname.toLowerCase()
        const hasValidExt = ALLOWED_EXTENSIONS.some(ext => filename.endsWith(ext))
        if (!hasValidExt) {
            throw new AppError('Invalid file type. Only TTF, OTF, WOFF, and WOFF2 are allowed', 400)
        }

        // Validar tamanho (max 5MB)
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            throw new AppError('File too large. Maximum size is 5MB', 400)
        }

        // Extrair nome da fonte do filename
        const fontName = file.originalname
            .replace(/\.(ttf|otf|woff|woff2)$/i, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase()) // Capitalizar

        // Criar family name (sem espaços, para uso em CSS)
        const familyName = `Custom-${fontName.replace(/\s+/g, '-')}-${Date.now()}`

        console.log(`[Fonts] Uploading font: ${fontName} (${file.size} bytes)`)

        // Upload para Cloudinary como raw resource
        const folder = `fonts/${userId}`
        const fileUrl = await uploadToCloudinary(file.buffer, folder, 'raw')

        // Salvar no banco de dados
        const { data: font, error } = await supabaseAdmin
            .from('user_fonts')
            .insert({
                user_id: userId,
                name: fontName,
                family_name: familyName,
                file_url: fileUrl,
                file_format: getFontFormat(filename)
            })
            .select()
            .single()

        if (error) {
            console.error('[Fonts] Insert error:', error)
            throw new AppError('Failed to save font', 500)
        }

        console.log(`[Fonts] Font uploaded successfully: ${font.id}`)
        res.json(font)
    } catch (error) {
        next(error)
    }
}

// GET /api/fonts - Listar fontes do usuário
export async function listFonts(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id
        if (!userId) throw new AppError('User not authenticated', 401)

        console.log(`[Fonts] Listing fonts for user ${userId}`)

        const { data: fonts, error } = await supabaseAdmin
            .from('user_fonts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[Fonts] List error:', error)
            throw new AppError('Failed to list fonts', 500)
        }

        console.log(`[Fonts] Found ${fonts?.length || 0} fonts`)
        res.json(fonts || [])
    } catch (error) {
        next(error)
    }
}

// DELETE /api/fonts/:id - Deletar fonte
export async function deleteFont(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id
        if (!userId) throw new AppError('User not authenticated', 401)

        const { id } = req.params
        if (!id) throw new AppError('Font ID required', 400)

        console.log(`[Fonts] Deleting font ${id} for user ${userId}`)

        const { error } = await supabaseAdmin
            .from('user_fonts')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) {
            console.error('[Fonts] Delete error:', error)
            throw new AppError('Failed to delete font', 500)
        }

        console.log(`[Fonts] Font deleted successfully`)
        res.json({ success: true })
    } catch (error) {
        next(error)
    }
}
