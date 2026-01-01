import type { SlideLayoutType } from '@/types/template'

export interface ParsedSlide {
  slideNumber: number
  headline: string
  body: string
  layoutType: SlideLayoutType
}

// Sequência padrão de layouts (baseado no template brands-decoded)
const DEFAULT_LAYOUT_SEQUENCE: SlideLayoutType[] = [
  'cover',      // Slide 1
  'imageTop',   // Slide 2
  'imageTop',   // Slide 3
  'textTop',    // Slide 4
  'fullImage',  // Slide 5
  'imageTop',   // Slide 6
  'textTop',    // Slide 7
  'textOnly',   // Slide 8
  'textTop',    // Slide 9
  'fullImage'   // Slide 10
]

/**
 * Parseia um script de carrossel em formato livre e retorna array de slides
 *
 * Suporta formatos como:
 * - **SLIDE 1**
 * - SLIDE 1
 * - Slide 1:
 * - [SLIDE 1]
 * - (Slide 1)
 * - SLIDE 1 (Capa)
 * - SLIDE 1 - Título
 */
export function parseCarouselScript(
  script: string,
  layoutSequence: SlideLayoutType[] = DEFAULT_LAYOUT_SEQUENCE
): ParsedSlide[] {
  if (!script.trim()) {
    return []
  }

  // Regex para detectar marcadores de slide
  // Captura: **SLIDE 1**, SLIDE 1, Slide 1:, [SLIDE 1], (Slide 1), etc.
  const slideMarkerRegex = /(?:^|\n)\s*(?:\*\*|\[|\()?\s*SLIDE\s+(\d+)\s*(?:\*\*|\]|\))?(?:\s*[-:()].*)?(?:\s*\n|\s*$)/gi

  // Encontrar todas as posições dos marcadores
  const markers: { index: number; slideNumber: number; fullMatch: string }[] = []
  let match

  while ((match = slideMarkerRegex.exec(script)) !== null) {
    markers.push({
      index: match.index,
      slideNumber: parseInt(match[1], 10),
      fullMatch: match[0]
    })
  }

  if (markers.length === 0) {
    // Tentar parsing alternativo: dividir por linhas duplas vazias
    return parseByParagraphs(script, layoutSequence)
  }

  // Extrair conteúdo de cada slide
  const slides: ParsedSlide[] = []

  for (let i = 0; i < markers.length; i++) {
    const currentMarker = markers[i]
    const nextMarker = markers[i + 1]

    // Posição onde começa o conteúdo (após o marcador)
    const contentStart = currentMarker.index + currentMarker.fullMatch.length

    // Posição onde termina o conteúdo (início do próximo marcador ou fim do script)
    const contentEnd = nextMarker ? nextMarker.index : script.length

    // Extrair e limpar o conteúdo
    const content = script.slice(contentStart, contentEnd).trim()

    // Separar headline e body
    const { headline, body } = extractHeadlineAndBody(content)

    // Determinar layout baseado na posição
    const layoutIndex = (currentMarker.slideNumber - 1) % layoutSequence.length
    const layoutType = layoutSequence[layoutIndex]

    slides.push({
      slideNumber: currentMarker.slideNumber,
      headline,
      body,
      layoutType
    })
  }

  // Ordenar por número do slide
  slides.sort((a, b) => a.slideNumber - b.slideNumber)

  // Renumerar sequencialmente (caso haja gaps)
  slides.forEach((slide, index) => {
    slide.slideNumber = index + 1
  })

  return slides
}

/**
 * Parsing alternativo: divide por parágrafos (linhas duplas vazias)
 */
function parseByParagraphs(
  script: string,
  layoutSequence: SlideLayoutType[]
): ParsedSlide[] {
  const paragraphs = script
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0)

  return paragraphs.map((content, index) => {
    const { headline, body } = extractHeadlineAndBody(content)
    const layoutIndex = index % layoutSequence.length

    return {
      slideNumber: index + 1,
      headline,
      body,
      layoutType: layoutSequence[layoutIndex]
    }
  })
}

/**
 * Extrai headline (primeira linha) e body (resto) do conteúdo
 */
function extractHeadlineAndBody(content: string): { headline: string; body: string } {
  // Dividir por quebras de linha
  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  if (lines.length === 0) {
    return { headline: '', body: '' }
  }

  // Primeira linha é o headline (remover formatação markdown)
  let headline = lines[0]
    .replace(/^\*\*/, '')  // Remove ** do início
    .replace(/\*\*$/, '')  // Remove ** do fim
    .replace(/^#+\s*/, '') // Remove # markdown headers
    .trim()

  // Resto é o body
  const bodyLines = lines.slice(1)
  let body = bodyLines
    .map(line => {
      // Remover formatação markdown básica
      return line
        .replace(/^\*\*/, '')
        .replace(/\*\*$/, '')
        .replace(/^\*/, '')
        .replace(/\*$/, '')
        .trim()
    })
    .join('\n')

  return { headline, body }
}

/**
 * Gera uma query de busca de imagem baseada no conteúdo do slide
 */
export function generateImageQuery(headline: string, body: string): string {
  // Combinar headline e primeiras palavras do body
  const combined = `${headline} ${body}`.slice(0, 100)

  // Remover palavras comuns e pontuação
  const stopWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'da', 'do', 'para', 'com', 'em', 'no', 'na', 'e', 'ou', 'que', 'se', 'por', 'como', 'mas', 'isso', 'este', 'esta', 'esse', 'essa', 'seu', 'sua']

  const words = combined
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .slice(0, 5)

  return words.join(' ')
}
