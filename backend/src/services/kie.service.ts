// Kie.ai Image Generation Service (Flux 2 Pro + GPT Image 1.5)
import { supabaseAdmin } from '../lib/supabase.js'
import { uploadToCloudinary } from './cloudinary.service.js'

const KIE_API_BASE = 'https://api.kie.ai/api/v1'
const SUPABASE_BUCKET = 'carousel-images'

// Modelos suportados
type ImageModel = 'flux-2/pro-text-to-image' | 'gpt-image/1.5-text-to-image' | 'nano-banana-pro'

interface ImageGenerationOptions {
  model?: ImageModel
}

interface CreateTaskResponse {
  code: number
  msg: string
  data: {
    taskId: string
  }
}

interface TaskResultResponse {
  code: number
  msg: string
  data: {
    status: 'pending' | 'processing' | 'completed' | 'failed'
    output?: {
      images?: string[]
    }
    error?: string
  }
}

export class KieService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.KIE_API_KEY || ''
    if (!this.apiKey) {
      console.warn('[Kie.ai] No API key configured (KIE_API_KEY)')
    }
  }

  /**
   * Cria uma task de geração de imagem
   * @param prompt - Descrição da imagem
   * @param options - Opções incluindo modelo (flux-2/pro ou gpt-image/1.5)
   */
  async createImageTask(prompt: string, options?: ImageGenerationOptions): Promise<{ taskId: string }> {
    if (!this.apiKey) {
      throw new Error('Kie.ai API key not configured')
    }

    const model = options?.model || 'flux-2/pro-text-to-image'

    // Input diferente baseado no modelo
    let input: any
    if (model === 'gpt-image/1.5-text-to-image') {
      input = { prompt, aspect_ratio: '1:1', quality: 'medium' }
    } else if (model === 'nano-banana-pro') {
      input = { prompt, aspect_ratio: '1:1', resolution: '1K', output_format: 'png' }
    } else {
      input = { prompt, aspect_ratio: '1:1', resolution: '1K' }
    }

    console.log(`[Kie.ai] Creating image task with model "${model}" for prompt: "${prompt.substring(0, 100)}..."`)

    const response = await fetch(`${KIE_API_BASE}/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, input })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Kie.ai] API error: ${response.status} - ${errorText}`)

      if (response.status === 401) {
        throw new Error('Kie.ai authentication failed - check API key')
      }
      if (response.status === 402) {
        throw new Error('Kie.ai insufficient credits')
      }
      if (response.status === 429) {
        throw new Error('Kie.ai rate limited - try again later')
      }

      throw new Error(`Kie.ai API error: ${response.status}`)
    }

    const data: CreateTaskResponse = await response.json()

    if (data.code !== 200) {
      throw new Error(`Kie.ai error: ${data.msg}`)
    }

    console.log(`[Kie.ai] Task created: ${data.data.taskId}`)
    return { taskId: data.data.taskId }
  }

  /**
   * Busca o resultado de uma task
   */
  async getTaskResult(taskId: string): Promise<{ status: string; imageUrl?: string; error?: string }> {
    if (!this.apiKey) {
      throw new Error('Kie.ai API key not configured')
    }

    const response = await fetch(`${KIE_API_BASE}/jobs/recordInfo?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Kie.ai API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    if (data.code !== 200 && data.code !== 0) {
      throw new Error(`Kie.ai error: ${data.msg || data.message}`)
    }

    const taskData = data.data || data

    // Status is in 'state' field
    const status = taskData.state || taskData.status || 'unknown'

    // Image URL is inside resultJson (stringified JSON)
    let imageUrl: string | undefined
    if (taskData.resultJson) {
      try {
        const resultData = JSON.parse(taskData.resultJson)
        imageUrl = resultData.resultUrls?.[0]
      } catch (e) {
        console.error('[Kie.ai] Failed to parse resultJson:', e)
      }
    }

    const error = taskData.failMsg || taskData.error

    console.log(`[Kie.ai] Task ${taskId} state: ${status}, imageUrl: ${imageUrl || 'none'}`)

    return { status, imageUrl, error }
  }

  /**
   * Aguarda uma task completar com polling
   */
  async waitForTask(taskId: string, timeoutMs: number = 120000): Promise<string> {
    const startTime = Date.now()
    const pollInterval = 3000  // 3 segundos entre cada check

    console.log(`[Kie.ai] Waiting for task ${taskId} to complete...`)

    while (Date.now() - startTime < timeoutMs) {
      const result = await this.getTaskResult(taskId)
      const statusLower = result.status?.toLowerCase() || ''

      // Check for completed status (various possible values)
      if (['completed', 'complete', 'success', 'succeeded', 'done', 'finished'].includes(statusLower)) {
        if (result.imageUrl) {
          console.log(`[Kie.ai] Task ${taskId} completed successfully!`)
          return result.imageUrl
        }
        console.log(`[Kie.ai] Task ${taskId} completed but no imageUrl found`)
      }

      // Check for failed status
      if (['failed', 'error', 'failure', 'cancelled', 'canceled'].includes(statusLower)) {
        throw new Error(`Kie.ai task failed: ${result.error || 'Unknown error'}`)
      }

      // Still processing - wait and continue
      const elapsed = Math.round((Date.now() - startTime) / 1000)
      console.log(`[Kie.ai] Task ${taskId} still ${result.status} (${elapsed}s elapsed)...`)

      await this.sleep(pollInterval)
    }

    throw new Error(`Kie.ai task ${taskId} timed out after ${timeoutMs}ms`)
  }

  /**
   * Faz download da imagem e upload para Cloudinary
   */
  async uploadToCloudinaryInternal(imageUrl: string): Promise<string> {
    console.log(`[Kie.ai] Downloading image from: ${imageUrl.substring(0, 60)}...`)

    // Download the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log(`[Kie.ai] Uploading to Cloudinary...`)

    // Upload to Cloudinary into 'ai-generated' folder
    const secureUrl = await uploadToCloudinary(buffer, 'ai-generated')

    console.log(`[Kie.ai] Uploaded successfully: ${secureUrl}`)
    return secureUrl
  }

  /**
   * Gera imagem e aguarda resultado (convenience method)
   * @param prompt - Descrição da imagem
   * @param options - Opções incluindo modelo
   */
  async generateImage(prompt: string, options?: ImageGenerationOptions): Promise<string> {
    const { taskId } = await this.createImageTask(prompt, options)
    const tempUrl = await this.waitForTask(taskId)

    // Upload to Cloudinary for permanent URL
    const permanentUrl = await this.uploadToCloudinaryInternal(tempUrl)
    return permanentUrl
  }

  /**
   * Gera múltiplas imagens em paralelo
   * @param prompts - Array de prompts
   * @param options - Opções incluindo modelo
   */
  async generateImages(prompts: string[], options?: ImageGenerationOptions): Promise<(string | null)[]> {
    console.log(`[Kie.ai] Generating ${prompts.length} images in parallel with model "${options?.model || 'flux-2/pro-text-to-image'}"...`)

    // Criar todas as tasks primeiro
    const taskPromises = prompts.map(async (prompt, index) => {
      try {
        const { taskId } = await this.createImageTask(prompt, options)
        return { index, taskId, error: null }
      } catch (error) {
        console.error(`[Kie.ai] Failed to create task for prompt ${index}:`, error)
        return { index, taskId: null, error: (error as Error).message }
      }
    })

    const tasks = await Promise.all(taskPromises)

    // Aguardar todas as tasks completarem
    const resultPromises = tasks.map(async (task) => {
      if (!task.taskId) {
        return null
      }

      try {
        return await this.waitForTask(task.taskId)
      } catch (error) {
        console.error(`[Kie.ai] Failed to wait for task ${task.taskId}:`, error)
        return null
      }
    })

    const results = await Promise.all(resultPromises)

    const successCount = results.filter(r => r !== null).length
    console.log(`[Kie.ai] Generated ${successCount}/${prompts.length} images successfully`)

    return results
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const kieService = new KieService()
