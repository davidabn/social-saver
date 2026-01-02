export interface ImageSearchResult {
  url: string
  title: string
  source: string
}

// Banco de imagens do Unsplash organizadas por categoria (FALLBACK)
const IMAGE_CATEGORIES: Record<string, ImageSearchResult[]> = {
  business: [
    { url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1080&q=80', title: 'Business meeting', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1080&q=80', title: 'Team presentation', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1080&q=80', title: 'Business strategy', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1080&q=80', title: 'Professional suit', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1080&q=80', title: 'Business planning', source: 'Unsplash' },
  ],
  technology: [
    { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&q=80', title: 'Technology circuit', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1080&q=80', title: 'Cybersecurity', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1080&q=80', title: 'Laptop coding', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1080&q=80', title: 'Tech workspace', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1080&q=80', title: 'Digital matrix', source: 'Unsplash' },
  ],
  ai: [
    { url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1080&q=80', title: 'AI brain', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1080&q=80', title: 'Robot face', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=1080&q=80', title: 'Neural network', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1080&q=80', title: 'Robot hand', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1507146153580-69a1fe6d8aa1?w=1080&q=80', title: 'AI concept', source: 'Unsplash' },
  ],
  marketing: [
    { url: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=1080&q=80', title: 'Marketing strategy', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&q=80', title: 'Analytics dashboard', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=1080&q=80', title: 'Social media', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1080&q=80', title: 'Instagram phone', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1080&q=80', title: 'Digital marketing', source: 'Unsplash' },
  ],
  teamwork: [
    { url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1080&q=80', title: 'Team collaboration', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1080&q=80', title: 'Office teamwork', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1080&q=80', title: 'Team meeting', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1080&q=80', title: 'Diverse team', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1080&q=80', title: 'Brainstorming', source: 'Unsplash' },
  ],
  success: [
    { url: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?w=1080&q=80', title: 'Victory celebration', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&q=80', title: 'Mountain top', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=1080&q=80', title: 'Do what you love', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=1080&q=80', title: 'Success jump', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1080&q=80', title: 'Achievement', source: 'Unsplash' },
  ],
  innovation: [
    { url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080&q=80', title: 'Digital globe', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1080&q=80', title: 'Modern office', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1080&q=80', title: 'Team with laptops', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1080&q=80', title: 'Web design', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1080&q=80', title: 'Woman with laptop', source: 'Unsplash' },
  ],
  finance: [
    { url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1080&q=80', title: 'Stock chart', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=1080&q=80', title: 'Money growth', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1080&q=80', title: 'Financial planning', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=1080&q=80', title: 'Calculator', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1080&q=80', title: 'Bitcoin', source: 'Unsplash' },
  ],
  education: [
    { url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1080&q=80', title: 'Classroom', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1080&q=80', title: 'Study books', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1080&q=80', title: 'Students', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1080&q=80', title: 'Graduation', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1080&q=80', title: 'Learning', source: 'Unsplash' },
  ],
  health: [
    { url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&q=80', title: 'Fitness', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=1080&q=80', title: 'Healthy food', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1080&q=80', title: 'Yoga meditation', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=1080&q=80', title: 'Running', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=1080&q=80', title: 'Doctor', source: 'Unsplash' },
  ],
  nature: [
    { url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1080&q=80', title: 'Forest', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1080&q=80', title: 'Mountain landscape', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&q=80', title: 'Beach', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=1080&q=80', title: 'Waterfall', source: 'Unsplash' },
    { url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1080&q=80', title: 'Green hills', source: 'Unsplash' },
  ],
}

// Palavras-chave para detectar categoria (usado no fallback)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  ai: ['ai', 'inteligencia artificial', 'inteligência artificial', 'machine learning', 'robot', 'automação', 'automacao', 'chatgpt', 'artificial intelligence'],
  technology: ['tech', 'tecnologia', 'software', 'digital', 'codigo', 'código', 'programação', 'programacao', 'computador', 'dados', 'data'],
  business: ['negócio', 'negocio', 'empresa', 'corporativo', 'executivo', 'ceo', 'gestão', 'gestao', 'business', 'empreendedor'],
  marketing: ['marketing', 'vendas', 'cliente', 'marca', 'branding', 'social media', 'instagram', 'conteúdo', 'conteudo', 'engajamento'],
  teamwork: ['equipe', 'time', 'colaboração', 'colaboracao', 'trabalho em equipe', 'team', 'reunião', 'reuniao', 'parceria'],
  success: ['sucesso', 'vitória', 'vitoria', 'conquista', 'resultado', 'meta', 'objetivo', 'crescimento', 'success'],
  innovation: ['inovação', 'inovacao', 'futuro', 'transformação', 'transformacao', 'disrupção', 'startup', 'criatividade'],
  finance: ['finanças', 'financas', 'dinheiro', 'investimento', 'lucro', 'economia', 'banco', 'finance', 'money'],
  education: ['educação', 'educacao', 'aprendizado', 'curso', 'treinamento', 'ensino', 'escola', 'universidade', 'conhecimento'],
  health: ['saúde', 'saude', 'fitness', 'bem-estar', 'exercício', 'exercicio', 'alimentação', 'alimentacao', 'mental'],
  nature: ['natureza', 'ambiente', 'sustentável', 'sustentavel', 'verde', 'eco', 'planeta', 'nature'],
}

export class PerplexityService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || ''
  }

  async searchImages(query: string, count: number = 3): Promise<ImageSearchResult[]> {
    console.log(`[Perplexity] Searching web for images: "${query}"`)

    // Se não tiver API key, usar fallback
    if (!this.apiKey) {
      console.log('[Perplexity] No API key configured, using fallback images')
      return this.getFallbackImages(query, count)
    }

    try {
      // Buscar imagens via Perplexity API
      const images = await this.searchWithPerplexity(query, count)

      if (images.length > 0) {
        console.log(`[Perplexity] Found ${images.length} images from web search`)
        return images
      }

      console.log('[Perplexity] No valid images found, using fallback')
    } catch (error) {
      console.error('[Perplexity] Search failed:', error)
    }

    // Fallback se não encontrar
    return this.getFallbackImages(query, count)
  }

  private async searchWithPerplexity(query: string, count: number): Promise<ImageSearchResult[]> {
    const prompt = this.buildImageSearchPrompt(query, count)

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.1
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    console.log('[Perplexity] Raw response:', content.substring(0, 500))

    // Extrair e validar imagens
    return this.parseImageResults(content)
  }

  private buildImageSearchPrompt(query: string, count: number): string {
    return `Search the web for "${query}" and find ${count} high-quality images.

I need REAL image URLs from websites you accessed. Look for images on:
- Unsplash (images.unsplash.com)
- Pexels (images.pexels.com)
- News sites
- Blog posts

RULES:
1. ONLY return URLs you found in your search that actually exist
2. URLs must be direct image links (ending in .jpg, .jpeg, .png, .webp or from unsplash/pexels)
3. If you cannot find real images, return an empty array

Return ONLY this JSON format (no other text):
{
  "images": [
    {"url": "https://actual-image-url.jpg", "title": "image description", "source": "website.com"}
  ]
}

IMPORTANT: I will verify these URLs. Only return URLs you are 100% sure exist.`
  }

  private parseImageResults(content: string): ImageSearchResult[] {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = content.match(/\{[\s\S]*?"images"[\s\S]*?\}(?=\s*$|\s*```)/m)
      if (!jsonMatch) {
        console.log('[Perplexity] No JSON found in response')
        return []
      }

      // Limpar o JSON
      let jsonStr = jsonMatch[0]
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim()

      const parsed = JSON.parse(jsonStr)

      if (!Array.isArray(parsed.images)) {
        console.log('[Perplexity] Invalid images array')
        return []
      }

      // Filtrar e validar URLs
      const validImages = parsed.images
        .filter((img: any) => {
          if (!img.url || typeof img.url !== 'string') return false
          return this.isValidImageUrl(img.url)
        })
        .map((img: any) => ({
          url: img.url,
          title: img.title || '',
          source: img.source || 'Web'
        }))

      console.log(`[Perplexity] Parsed ${validImages.length} valid images`)
      return validImages

    } catch (error) {
      console.error('[Perplexity] Failed to parse response:', error)
      return []
    }
  }

  private isValidImageUrl(url: string): boolean {
    try {
      new URL(url) // Verificar se é URL válida
    } catch {
      return false
    }

    const lowerUrl = url.toLowerCase()

    // Aceitar URLs de bancos de imagem conhecidos
    const trustedSources = [
      'unsplash.com',
      'pexels.com',
      'pixabay.com',
      'images.unsplash.com',
      'images.pexels.com'
    ]

    for (const source of trustedSources) {
      if (lowerUrl.includes(source)) {
        return true
      }
    }

    // Verificar extensão de imagem
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    for (const ext of imageExtensions) {
      if (lowerUrl.includes(ext)) {
        return true
      }
    }

    return false
  }

  private getFallbackImages(query: string, count: number): ImageSearchResult[] {
    const category = this.detectCategory(query.toLowerCase())
    console.log(`[Perplexity] Using fallback category: ${category}`)

    const categoryImages = IMAGE_CATEGORIES[category] || IMAGE_CATEGORIES.business
    const shuffled = [...categoryImages].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }

  private detectCategory(query: string): string {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (query.includes(keyword)) {
          return category
        }
      }
    }
    return 'business'
  }

  async searchImagesForSlide(slideHeadline: string, slideBody: string, theme: string): Promise<ImageSearchResult[]> {
    // Combinar headline, body e theme para melhor busca
    const query = `${theme} ${slideHeadline}`.trim()
    return this.searchImages(query, 3)
  }
}

export const perplexityService = new PerplexityService()
