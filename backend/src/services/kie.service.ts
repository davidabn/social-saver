// Kie.ai Flux 2 Pro Image Generation Service

const KIE_API_BASE = 'https://api.kie.ai/api/v1'

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
   * Cria uma task de geração de imagem no Flux 2 Pro
   */
  async createImageTask(prompt: string): Promise<{ taskId: string }> {
    if (!this.apiKey) {
      throw new Error('Kie.ai API key not configured')
    }

    console.log(`[Kie.ai] Creating image task for prompt: "${prompt.substring(0, 100)}..."`)

    const response = await fetch(`${KIE_API_BASE}/jobs/createTask`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'flux-2/pro-text-to-image',
        input: {
          prompt: prompt,
          aspect_ratio: '4:5',  // Instagram vertical format
          resolution: '1K'
        }
      })
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

    const data: TaskResultResponse = await response.json()

    if (data.code !== 200) {
      throw new Error(`Kie.ai error: ${data.msg}`)
    }

    const status = data.data.status
    const imageUrl = data.data.output?.images?.[0]
    const error = data.data.error

    return { status, imageUrl, error }
  }

  /**
   * Aguarda uma task completar com polling
   */
  async waitForTask(taskId: string, timeoutMs: number = 120000): Promise<string> {
    const startTime = Date.now()
    const pollInterval = 2000  // 2 segundos entre cada check

    console.log(`[Kie.ai] Waiting for task ${taskId} to complete...`)

    while (Date.now() - startTime < timeoutMs) {
      const result = await this.getTaskResult(taskId)

      if (result.status === 'completed' && result.imageUrl) {
        console.log(`[Kie.ai] Task ${taskId} completed successfully`)
        return result.imageUrl
      }

      if (result.status === 'failed') {
        throw new Error(`Kie.ai task failed: ${result.error || 'Unknown error'}`)
      }

      // Aguarda antes do próximo poll
      await this.sleep(pollInterval)
    }

    throw new Error(`Kie.ai task ${taskId} timed out after ${timeoutMs}ms`)
  }

  /**
   * Gera imagem e aguarda resultado (convenience method)
   */
  async generateImage(prompt: string): Promise<string> {
    const { taskId } = await this.createImageTask(prompt)
    return this.waitForTask(taskId)
  }

  /**
   * Gera múltiplas imagens em paralelo
   */
  async generateImages(prompts: string[]): Promise<(string | null)[]> {
    console.log(`[Kie.ai] Generating ${prompts.length} images in parallel...`)

    // Criar todas as tasks primeiro
    const taskPromises = prompts.map(async (prompt, index) => {
      try {
        const { taskId } = await this.createImageTask(prompt)
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
