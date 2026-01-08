import type { CarouselTemplate, HeaderTexts, GradientOverlayConfig } from '@/types/template'
import { CANVAS_WIDTH, CANVAS_HEIGHT, ProfileBranding, TextSegment } from '@/types/carousel'
import { getFontFamily as getFontFamilyFromCatalog } from '@/templates/fonts'

const API_URL = 'http://localhost:3001/api'

// URL da imagem mockup para slides sem imagem
export const MOCKUP_IMAGE_URL = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1080&q=80'

// Calcula luminância relativa de uma cor (0 = preto, 1 = branco)
// Fórmula WCAG para acessibilidade
export function getLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255

  const [rs, gs, bs] = [r, g, b].map(c =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  )

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

// Retorna cor de texto com bom contraste para o fundo dado
export function getContrastTextColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor)
  // Se luminância > 0.5, fundo é claro, usa texto escuro
  return luminance > 0.5 ? '#1A1A1A' : '#FFFFFF'
}

// Proxy de imagem para evitar problemas de CORS
export function getProxyImageUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('data:')) return url
  if (url.includes('/api/proxy/')) return url
  // URLs que podem ser acessadas diretamente (não precisam de proxy)
  if (url.includes('unsplash.com') ||
      url.includes('pexels.com') ||
      url.includes('pixabay.com') ||
      url.includes('supabase.co') ||
      url.includes('kie.ai') ||            // Kie.ai image generation CDN
      url.includes('replicate.delivery')    // Common AI image CDN
  ) {
    return url
  }
  return `${API_URL}/proxy/image?url=${encodeURIComponent(url)}`
}

// Desenha o header de 3 colunas
// backgroundColor é opcional - se fornecido, ajusta cor do texto automaticamente para contraste
export function drawHeader(
  ctx: CanvasRenderingContext2D,
  template: CarouselTemplate,
  headerTexts: HeaderTexts,
  backgroundColor?: string
) {
  if (!template.header.enabled) return

  const { height } = template.header
  const { headerFont, headerSize } = template.typography
  const padding = 30
  const yPos = height / 2 + 5  // Posição vertical do texto

  // Usa cor com contraste automático se backgroundColor fornecido
  const textColor = backgroundColor
    ? getContrastTextColor(backgroundColor)
    : template.header.textColor

  ctx.save()
  ctx.font = `${headerSize}px ${headerFont}`
  ctx.fillStyle = textColor
  ctx.textBaseline = 'middle'

  // Texto esquerdo
  ctx.textAlign = 'left'
  ctx.fillText(headerTexts.left.toUpperCase(), padding, yPos)

  // Texto central
  ctx.textAlign = 'center'
  ctx.fillText(headerTexts.center.toUpperCase(), CANVAS_WIDTH / 2, yPos)

  // Texto direito
  ctx.textAlign = 'right'
  ctx.fillText(headerTexts.right.toUpperCase(), CANVAS_WIDTH - padding, yPos)

  ctx.restore()
}

// Desenha o footer de 3 colunas (igual ao header, mas no bottom)
// Não desenha no primeiro slide
// backgroundColor é opcional - se fornecido, ajusta cor do texto automaticamente para contraste
export function drawFooter(
  ctx: CanvasRenderingContext2D,
  template: CarouselTemplate,
  footerTexts: HeaderTexts,
  slideNumber: number,
  backgroundColor?: string
) {
  // Não desenha footer no primeiro slide
  if (slideNumber === 1) return

  // Fallbacks para valores undefined
  const height = template.header?.height ?? 50
  const headerFont = template.typography?.headerFont ?? 'Inter, sans-serif'
  const headerSize = template.typography?.headerSize ?? 14
  const padding = 30

  // Usa cor com contraste automático se backgroundColor fornecido
  const textColor = backgroundColor
    ? getContrastTextColor(backgroundColor)
    : template.header?.textColor ?? '#FFFFFF'

  // Usa tamanho de fonte maior para o footer (mínimo 14px)
  const footerFontSize = Math.max(14, headerSize)

  // Posição Y no BOTTOM do canvas
  const yPos = CANVAS_HEIGHT - (height / 2) - 5

  ctx.save()
  ctx.font = `${footerFontSize}px ${headerFont}`
  ctx.fillStyle = textColor
  ctx.textBaseline = 'middle'

  // Texto esquerdo
  ctx.textAlign = 'left'
  ctx.fillText(footerTexts.left.toUpperCase(), padding, yPos)

  // Texto central
  ctx.textAlign = 'center'
  ctx.fillText(footerTexts.center.toUpperCase(), CANVAS_WIDTH / 2, yPos)

  // Texto direito
  ctx.textAlign = 'right'
  ctx.fillText(footerTexts.right.toUpperCase(), CANVAS_WIDTH - padding, yPos)

  ctx.restore()
}

// Desenha gradient overlay
export function drawGradientOverlay(
  ctx: CanvasRenderingContext2D,
  config: GradientOverlayConfig,
  startY: number = 0,
  endY: number = CANVAS_HEIGHT
) {
  if (!config.enabled) return

  ctx.save()

  let gradient: CanvasGradient

  if (config.direction === 'top') {
    gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT * 0.5)
    gradient.addColorStop(0, hexToRgba(config.color, config.endOpacity))
    gradient.addColorStop(1, hexToRgba(config.color, config.startOpacity))
  } else if (config.direction === 'bottom') {
    gradient = ctx.createLinearGradient(0, startY, 0, endY)
    gradient.addColorStop(0, hexToRgba(config.color, config.startOpacity))
    gradient.addColorStop(0.15, hexToRgba(config.color, config.startOpacity * 0.3))
    gradient.addColorStop(0.5, hexToRgba(config.color, config.endOpacity * 0.6))
    gradient.addColorStop(1, hexToRgba(config.color, config.endOpacity))
  } else {
    // full - gradient em toda a imagem
    gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
    gradient.addColorStop(0, hexToRgba(config.color, config.startOpacity))
    gradient.addColorStop(0.5, hexToRgba(config.color, (config.startOpacity + config.endOpacity) / 2))
    gradient.addColorStop(1, hexToRgba(config.color, config.endOpacity))
  }

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  ctx.restore()
}

/**
 * Desenha textura granulada (noise/grain) no canvas
 * @param ctx - Contexto do canvas
 * @param intensity - Intensidade do grain (0-100)
 */
export function drawGrain(
  ctx: CanvasRenderingContext2D,
  intensity: number = 0
): void {
  if (intensity <= 0) return

  const normalizedIntensity = intensity / 100

  // Usar dimensões reais do canvas (suporta High DPI)
  const width = ctx.canvas.width
  const height = ctx.canvas.height

  // Pegar os pixels atuais do canvas
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // Aplicar noise diretamente nos pixels (muito mais rápido que fillRect)
  for (let i = 0; i < data.length; i += 8) { // Pula de 2 em 2 pixels para performance
    if (Math.random() > 0.5) {
      const noise = (Math.random() - 0.5) * 255 * normalizedIntensity * 0.3

      // Aplica noise nos canais RGB (não no alpha)
      data[i] = Math.min(255, Math.max(0, data[i] + noise))     // R
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise)) // G
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise)) // B
    }
  }

  // Colocar os pixels modificados de volta
  ctx.putImageData(imageData, 0, 0)
}

// Converte hex para rgba
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Desenha um placeholder visual para área de imagem
 * Usado quando não há imagem definida no slide
 */
export function drawImagePlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  borderRadius: number = 20
): void {
  ctx.save()

  // Fundo cinza neutro com bordas arredondadas
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, borderRadius)
  ctx.fillStyle = '#E5E7EB'  // Cinza claro (gray-200)
  ctx.fill()

  // Ícone de imagem no centro (desenho simplificado de montanha/sol)
  const centerX = x + width / 2
  const centerY = y + height / 2
  const iconSize = Math.min(width, height) * 0.15  // 15% do menor lado

  ctx.strokeStyle = '#9CA3AF'  // Cinza médio (gray-400)
  ctx.fillStyle = '#9CA3AF'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Retângulo externo (moldura)
  const frameSize = iconSize * 1.5
  ctx.strokeRect(
    centerX - frameSize / 2,
    centerY - frameSize / 2,
    frameSize,
    frameSize
  )

  // Sol (círculo preenchido no canto superior direito)
  ctx.beginPath()
  ctx.arc(
    centerX + frameSize * 0.2,
    centerY - frameSize * 0.2,
    iconSize * 0.2,
    0,
    Math.PI * 2
  )
  ctx.fill()

  // Montanhas (triângulos preenchidos)
  ctx.beginPath()
  // Montanha maior (esquerda)
  ctx.moveTo(centerX - frameSize * 0.35, centerY + frameSize * 0.35)
  ctx.lineTo(centerX - frameSize * 0.05, centerY - frameSize * 0.1)
  ctx.lineTo(centerX + frameSize * 0.25, centerY + frameSize * 0.35)
  ctx.closePath()
  ctx.fill()

  // Montanha menor (direita, sobreposta)
  ctx.fillStyle = '#B0B5BD'  // Um pouco mais escuro para contraste
  ctx.beginPath()
  ctx.moveTo(centerX, centerY + frameSize * 0.35)
  ctx.lineTo(centerX + frameSize * 0.2, centerY + frameSize * 0.05)
  ctx.lineTo(centerX + frameSize * 0.4, centerY + frameSize * 0.35)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

// Wrap text com suporte a limite de linhas e quebras manuais (\n)
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = 4
): string[] {
  if (!text) return []

  const lines: string[] = []

  // Primeiro divide por quebras manuais (\n)
  const paragraphs = text.split('\n')

  for (const paragraph of paragraphs) {
    if (lines.length >= maxLines) break

    // Se parágrafo vazio, adiciona linha vazia
    if (!paragraph.trim()) {
      lines.push('')
      continue
    }

    // Wrap do parágrafo por palavras
    const words = paragraph.split(' ')
    let currentLine = ''

    for (const word of words) {
      if (lines.length >= maxLines) break

      const testLine = currentLine ? `${currentLine} ${word}` : word
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine)
    }
  }

  return lines.slice(0, maxLines)
}

// Desenha texto com sublinhado em palavras específicas
export function drawTextWithUnderline(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  highlightWords: string[] = [],
  underlineColor: string = '#FF4500',
  underlineThickness: number = 3
) {
  if (!text) return

  // Se não houver palavras para destacar, desenha normalmente
  if (highlightWords.length === 0) {
    ctx.fillText(text, x, y)
    return
  }

  // Desenha o texto normalmente primeiro
  ctx.fillText(text, x, y)

  // Depois adiciona sublinhados nas palavras destacadas
  const words = text.split(' ')
  let currentX = x

  ctx.save()
  ctx.strokeStyle = underlineColor
  ctx.lineWidth = underlineThickness

  for (const word of words) {
    const cleanWord = word.replace(/[.,!?;:]/g, '').toLowerCase()
    const wordWidth = ctx.measureText(word + ' ').width

    if (highlightWords.some(hw => cleanWord.includes(hw.toLowerCase()))) {
      const textMetrics = ctx.measureText(word)
      const underlineY = y + 8  // Posição abaixo do texto

      ctx.beginPath()
      ctx.moveTo(currentX, underlineY)
      ctx.lineTo(currentX + textMetrics.width, underlineY)
      ctx.stroke()
    }

    currentX += wordWidth
  }

  ctx.restore()
}

// Desenha linha separadora
export function drawSeparatorLine(
  ctx: CanvasRenderingContext2D,
  y: number,
  color: string,
  thickness: number = 2,
  startX: number = 40,
  endX: number = CANVAS_WIDTH - 40
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = thickness
  ctx.beginPath()
  ctx.moveTo(startX, y)
  ctx.lineTo(endX, y)
  ctx.stroke()
  ctx.restore()
}

// Desenha linhas separadoras duplas (estilo hand-drawn)
// Duas linhas horizontais paralelas centralizadas
export function drawDoubleSeparatorLines(
  ctx: CanvasRenderingContext2D,
  y: number,
  color: string = '#1A1A1A',
  lineWidth: number = 120,
  thickness: number = 2,
  gap: number = 8
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = thickness

  // Centraliza as linhas
  const centerX = CANVAS_WIDTH / 2
  const startX = centerX - lineWidth / 2
  const endX = centerX + lineWidth / 2

  // Linha superior
  ctx.beginPath()
  ctx.moveTo(startX, y - gap / 2)
  ctx.lineTo(endX, y - gap / 2)
  ctx.stroke()

  // Linha inferior
  ctx.beginPath()
  ctx.moveTo(startX, y + gap / 2)
  ctx.lineTo(endX, y + gap / 2)
  ctx.stroke()

  ctx.restore()
}

// Desenha seta decorativa estilo hand-drawn
// Posicionada no canto inferior direito
export function drawHandDrawnArrow(
  ctx: CanvasRenderingContext2D,
  color: string = '#1A1A1A',
  x?: number,
  y?: number
) {
  ctx.save()

  // Posição padrão: canto inferior direito
  const arrowX = x ?? CANVAS_WIDTH - 100
  const arrowY = y ?? CANVAS_HEIGHT - 80

  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Desenha a linha principal da seta (levemente curvada para parecer hand-drawn)
  ctx.beginPath()
  ctx.moveTo(arrowX, arrowY + 10)
  ctx.quadraticCurveTo(arrowX + 25, arrowY + 8, arrowX + 50, arrowY + 10)
  ctx.stroke()

  // Desenha a ponta da seta (triângulo)
  ctx.beginPath()
  ctx.moveTo(arrowX + 50, arrowY + 10)
  ctx.lineTo(arrowX + 40, arrowY + 2)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(arrowX + 50, arrowY + 10)
  ctx.lineTo(arrowX + 40, arrowY + 18)
  ctx.stroke()

  ctx.restore()
}

// Carrega imagem com fallback
// Cache global de imagens para evitar recarregamento
const imageCache = new Map<string, HTMLImageElement>()

export function loadImage(url: string): Promise<HTMLImageElement> {
  const cacheKey = url

  // Retorna do cache se já carregou
  if (imageCache.has(cacheKey)) {
    return Promise.resolve(imageCache.get(cacheKey)!)
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageCache.set(cacheKey, img)  // Guarda no cache
      resolve(img)
    }
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = getProxyImageUrl(url) || ''
  })
}

// Desenha imagem mantendo aspect ratio (cover) com suporte a escala e offset
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number = 1.0,
  offsetX: number = 0,
  offsetY: number = 0
) {
  const imgRatio = img.width / img.height
  const areaRatio = width / height

  let baseWidth, baseHeight

  if (imgRatio > areaRatio) {
    // Imagem mais larga - ajusta pela altura
    baseHeight = height
    baseWidth = img.width * (height / img.height)
  } else {
    // Imagem mais alta - ajusta pela largura
    baseWidth = width
    baseHeight = img.height * (width / img.width)
  }

  // Aplica escala
  const drawWidth = baseWidth * scale
  const drawHeight = baseHeight * scale

  // Calcula posição central + offset
  // Offset é em porcentagem do tamanho "extra" disponível pela escala
  const extraWidth = drawWidth - width
  const extraHeight = drawHeight - height

  // Posição base (centralizada)
  let drawX = x + (width - drawWidth) / 2
  let drawY = y + (height - drawHeight) / 2

  // Aplica offset (limitado ao espaço extra disponível)
  if (extraWidth > 0) {
    const maxOffsetX = extraWidth / 2
    drawX -= (offsetX / 100) * maxOffsetX * 2
  }
  if (extraHeight > 0) {
    const maxOffsetY = extraHeight / 2
    drawY -= (offsetY / 100) * maxOffsetY * 2
  }

  // Clip para não vazar fora do frame
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()

  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

  ctx.restore()
}

// Desenha imagem no tamanho original (ou proporcional se muito grande)
// Usado para template hand-drawn onde imagens não devem ser esticadas
export function drawImageOriginalSize(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  areaX: number,
  areaY: number,
  areaWidth: number,
  maxHeight?: number,
  offsetX: number = 0,
  offsetY: number = 0
): { width: number; height: number } {
  // Calcula escala para caber na área (se necessário)
  let scale = 1

  // Se a imagem é maior que a área, reduz proporcionalmente
  if (img.width > areaWidth) {
    scale = areaWidth / img.width
  }

  // Se tem altura máxima e a imagem ainda é muito alta, reduz mais
  if (maxHeight && img.height * scale > maxHeight) {
    scale = maxHeight / img.height
  }

  const drawWidth = img.width * scale
  const drawHeight = img.height * scale

  // Centraliza horizontalmente na área + aplica offset
  const x = areaX + (areaWidth - drawWidth) / 2 + offsetX
  const y = areaY + offsetY

  ctx.drawImage(img, x, y, drawWidth, drawHeight)

  // Retorna as dimensões desenhadas (útil para calcular posição do headline)
  return { width: drawWidth, height: drawHeight }
}

// Converte porcentagem para pixels
export function percentToPixel(percent: number, dimension: 'width' | 'height'): number {
  const base = dimension === 'width' ? CANVAS_WIDTH : CANVAS_HEIGHT
  return (percent / 100) * base
}

// Cria string de fonte com estilo correto (italic/normal, weight)
export function createFontString(
  size: number,
  font: string,
  weight: string = 'normal',
  style: string = 'normal'
): string {
  // Formato: "italic normal 52px Georgia, serif" ou "normal bold 52px Georgia, serif"
  return `${style} ${weight} ${size}px ${font}`
}

// Cria string de fonte condensed bold (para headlines em UPPERCASE)
export function createCondensedFontString(
  size: number,
  font: string,
  weight: string = 'bold'
): string {
  // Formato: "bold 44px Impact, sans-serif"
  return `${weight} ${size}px ${font}`
}

// Resolve o nome da fonte para o CSS font-family correto
export function resolveFont(fontName: string | undefined, fallback: string): string {
  if (!fontName) return fallback
  // Tenta buscar no catálogo de fontes
  const catalogFamily = getFontFamilyFromCatalog(fontName)
  return catalogFamily || fontName
}

// Cria string de fonte com suporte a fontes customizadas do catálogo
export function createCustomFontString(
  size: number,
  fontName: string | undefined,
  fallbackFont: string,
  weight: number | string = 400,
  style: 'normal' | 'italic' = 'normal'
): string {
  const fontFamily = resolveFont(fontName, fallbackFont)
  const fontWeight = typeof weight === 'number' ? weight : weight
  return `${style} ${fontWeight} ${size}px ${fontFamily}`
}

// Calcula tamanho de fonte dinâmico baseado no espaço disponível e quantidade de texto
export function calculateDynamicFontSize(
  textLength: number,
  availableHeight: number,
  minSize: number,
  maxSize: number,
  baseSize: number
): number {
  // Margem inferior reservada
  const bottomMargin = 40

  // Espaço útil para texto
  const usableHeight = availableHeight - bottomMargin

  // Se tem pouco texto e muito espaço, aumenta a fonte
  if (textLength < 50 && usableHeight > 400) {
    return maxSize
  }

  if (textLength < 100 && usableHeight > 350) {
    return Math.min(maxSize, baseSize + 16)
  }

  if (textLength < 150 && usableHeight > 300) {
    return Math.min(maxSize, baseSize + 8)
  }

  if (textLength < 200 && usableHeight > 250) {
    return baseSize
  }

  // Muito texto - pode precisar reduzir
  if (textLength > 300) {
    return Math.max(minSize, baseSize - 8)
  }

  return baseSize
}

// Desenha branding card do perfil com linhas horizontais (estilo Instagram)
// Layout: ─────── [Avatar] Nome ✓ ───────
//                        @username
export async function drawProfileBranding(
  ctx: CanvasRenderingContext2D,
  branding: ProfileBranding,
  _x: number,
  y: number,
  textColor: string = '#FFFFFF',
  canvasWidth: number = 1080,
  scale: number = 1.0
): Promise<{ height: number }> {
  // Todas as dimensões são escaladas
  const avatarSize = 48 * scale
  const lineWidth = 80 * scale   // Largura das linhas horizontais
  const lineGap = 16 * scale     // Espaço entre linha e avatar
  const spacing = 12 * scale     // Espaço entre avatar e texto
  const nameFontSize = 20 * scale
  const usernameFontSize = 16 * scale
  const checkmarkRadius = 9 * scale
  const nameOffsetY = 8 * scale
  const usernameOffsetY = 14 * scale

  ctx.save()

  // Calcular largura do nome + checkmark
  ctx.font = `bold ${nameFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  const nameText = branding.displayName || 'Seu Nome'
  const nameWidth = ctx.measureText(nameText).width
  const checkmarkWidth = branding.isVerified ? 28 * scale : 0  // 20px círculo + 8px gap

  // Largura total do conteúdo central: linha + gap + avatar + gap + nome + checkmark + gap + linha
  const contentWidth = lineWidth + lineGap + avatarSize + spacing + nameWidth + checkmarkWidth + lineGap + lineWidth

  // Posição X centralizada
  const startX = (canvasWidth - contentWidth) / 2
  const centerY = y + avatarSize / 2

  // 1. Linha horizontal esquerda
  ctx.strokeStyle = hexToRgba(textColor, 0.4)
  ctx.lineWidth = 1 * scale
  ctx.beginPath()
  ctx.moveTo(startX, centerY)
  ctx.lineTo(startX + lineWidth, centerY)
  ctx.stroke()

  // 2. Avatar circular
  const avatarX = startX + lineWidth + lineGap
  const avatarY = y

  if (branding.avatarUrl) {
    try {
      const avatarImg = await loadImage(branding.avatarUrl)

      ctx.beginPath()
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.save()
      ctx.clip()

      const imgWidth = avatarImg.naturalWidth || avatarImg.width
      const imgHeight = avatarImg.naturalHeight || avatarImg.height
      const minDim = Math.min(imgWidth, imgHeight)
      const sx = (imgWidth - minDim) / 2
      const sy = (imgHeight - minDim) / 2

      ctx.drawImage(avatarImg, sx, sy, minDim, minDim, avatarX, avatarY, avatarSize, avatarSize)
      ctx.restore()
    } catch (e) {
      console.error('Failed to load avatar:', e)
      ctx.fillStyle = '#666666'
      ctx.beginPath()
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  } else {
    ctx.fillStyle = '#666666'
    ctx.beginPath()
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // 3. Nome + Checkmark (à direita do avatar)
  const textX = avatarX + avatarSize + spacing
  ctx.fillStyle = textColor
  ctx.font = `bold ${nameFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(nameText, textX, centerY - nameOffsetY)

  if (branding.isVerified) {
    const checkX = textX + nameWidth + 16 * scale
    const checkY = centerY - nameOffsetY

    // Círculo azul
    ctx.fillStyle = '#1DA1F2'
    ctx.beginPath()
    ctx.arc(checkX, checkY, checkmarkRadius, 0, Math.PI * 2)
    ctx.fill()

    // Checkmark branco
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2 * scale
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(checkX - 4 * scale, checkY)
    ctx.lineTo(checkX - 1 * scale, checkY + 3 * scale)
    ctx.lineTo(checkX + 4 * scale, checkY - 3 * scale)
    ctx.stroke()
  }

  // 4. @username (abaixo do nome, alinhado)
  ctx.fillStyle = hexToRgba(textColor, 0.6)
  ctx.font = `${usernameFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  const usernameText = branding.username ? `@${branding.username}` : '@username'
  ctx.fillText(usernameText, textX, centerY + usernameOffsetY)

  // 5. Linha horizontal direita
  const rightLineX = textX + nameWidth + checkmarkWidth + lineGap
  ctx.strokeStyle = hexToRgba(textColor, 0.4)
  ctx.lineWidth = 1 * scale
  ctx.beginPath()
  ctx.moveTo(rightLineX, centerY)
  ctx.lineTo(rightLineX + lineWidth, centerY)
  ctx.stroke()

  ctx.restore()

  return { height: avatarSize + 20 * scale }
}

// ===========================================
// RICH TEXT FUNCTIONS - Para formatação inline
// ===========================================

/**
 * Parseia HTML para array de TextSegments
 * Suporta: <b>, <strong>, <i>, <em>, <u>, <font>, <span style="...">
 */
export function parseHtmlToSegments(html: string): TextSegment[] {
  if (!html) return [{ text: '' }]

  // Se não contém tags HTML, retorna como texto simples
  if (!html.includes('<')) {
    return [{ text: html.replace(/<br\s*\/?>/gi, '\n') }]
  }

  const segments: TextSegment[] = []

  // Criar um elemento temporário para parsear HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  // Função recursiva para processar nós
  function processNode(node: Node, inheritedStyle: Partial<TextSegment>): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      if (text) {
        segments.push({
          text,
          ...inheritedStyle
        })
      }
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return

    const element = node as HTMLElement
    const tagName = element.tagName.toLowerCase()

    // Construir estilo para este nó
    const style: Partial<TextSegment> = { ...inheritedStyle }

    // Tags de formatação
    if (tagName === 'b' || tagName === 'strong') {
      style.bold = true
    }
    if (tagName === 'i' || tagName === 'em') {
      style.italic = true
    }
    if (tagName === 'u') {
      style.underline = true
    }

    // Tag <font> (usada por execCommand)
    if (tagName === 'font') {
      const face = element.getAttribute('face')
      const color = element.getAttribute('color')
      if (face) style.font = face
      if (color) style.color = color
    }

    // Tag <span> com style inline
    if (tagName === 'span') {
      const inlineStyle = element.style
      if (inlineStyle.fontFamily) {
        style.font = inlineStyle.fontFamily.replace(/['"]/g, '').split(',')[0]
      }
      if (inlineStyle.color) {
        style.color = rgbToHex(inlineStyle.color)
      }
      if (inlineStyle.fontWeight === 'bold' || parseInt(inlineStyle.fontWeight) >= 700) {
        style.bold = true
      }
      if (inlineStyle.fontStyle === 'italic') {
        style.italic = true
      }
      if (inlineStyle.textDecoration?.includes('underline')) {
        style.underline = true
      }
    }

    // Tag <br>
    if (tagName === 'br') {
      segments.push({ text: '\n', ...inheritedStyle })
      return
    }

    // Processar filhos
    for (const child of Array.from(node.childNodes)) {
      processNode(child, style)
    }
  }

  // Processar todos os nós filhos
  for (const child of Array.from(tempDiv.childNodes)) {
    processNode(child, {})
  }

  // Consolidar segmentos adjacentes com mesmo estilo
  return consolidateSegments(segments)
}

/**
 * Consolida segmentos adjacentes com o mesmo estilo
 */
function consolidateSegments(segments: TextSegment[]): TextSegment[] {
  if (segments.length === 0) return [{ text: '' }]

  const result: TextSegment[] = []

  for (const segment of segments) {
    const last = result[result.length - 1]

    // Se o último segmento tem o mesmo estilo, mescla
    if (last &&
        last.bold === segment.bold &&
        last.italic === segment.italic &&
        last.underline === segment.underline &&
        last.font === segment.font &&
        last.color === segment.color) {
      last.text += segment.text
    } else {
      result.push({ ...segment })
    }
  }

  return result.length > 0 ? result : [{ text: '' }]
}

/**
 * Converte RGB string para hex
 */
function rgbToHex(rgb: string): string {
  if (!rgb) return ''
  if (rgb.startsWith('#')) return rgb

  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return rgb

  const r = parseInt(match[1]).toString(16).padStart(2, '0')
  const g = parseInt(match[2]).toString(16).padStart(2, '0')
  const b = parseInt(match[3]).toString(16).padStart(2, '0')

  return `#${r}${g}${b}`
}

/**
 * Extrai texto puro de HTML
 */
export function htmlToPlainText(html: string): string {
  if (!html) return ''
  if (!html.includes('<')) return html

  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html.replace(/<br\s*\/?>/gi, '\n')
  return tempDiv.textContent || ''
}

interface RichTextStyle {
  fontSize: number
  fontFamily: string
  fontWeight: number | string
  fontStyle?: string  // 'normal' | 'italic' ou string do template
  color: string
  textAlign?: 'left' | 'center' | 'right'
  lineHeight?: number
  uppercase?: boolean  // Converter texto para MAIÚSCULAS ao renderizar
}

/**
 * Renderiza rich text no canvas com suporte a formatação inline
 * Retorna a altura total renderizada
 */
export function renderRichText(
  ctx: CanvasRenderingContext2D,
  htmlOrSegments: string | TextSegment[],
  x: number,
  y: number,
  maxWidth: number,
  baseStyle: RichTextStyle,
  maxLines: number = 10
): number {
  // Converter para segments se for string
  const segments = typeof htmlOrSegments === 'string'
    ? parseHtmlToSegments(htmlOrSegments)
    : htmlOrSegments

  // Se não há segmentos ou está vazio, retorna
  if (segments.length === 0 || (segments.length === 1 && !segments[0].text)) {
    return 0
  }

  const lineHeight = baseStyle.lineHeight || 1.3
  const actualLineHeight = baseStyle.fontSize * lineHeight

  ctx.save()
  ctx.textAlign = baseStyle.textAlign || 'left'
  ctx.textBaseline = 'top'

  // Dividir em linhas respeitando quebras e maxWidth
  const lines = splitIntoLines(ctx, segments, maxWidth, baseStyle, maxLines)

  let currentY = y

  for (const line of lines) {
    // Calcular posição X baseada no alinhamento
    let lineX = x
    if (baseStyle.textAlign === 'center') {
      const lineWidth = measureLineWidth(ctx, line, baseStyle)
      lineX = x + (maxWidth - lineWidth) / 2
    } else if (baseStyle.textAlign === 'right') {
      const lineWidth = measureLineWidth(ctx, line, baseStyle)
      lineX = x + maxWidth - lineWidth
    }

    // Renderizar cada segmento da linha
    let currentX = lineX

    for (const segment of line) {
      // Aplicar estilo do segmento
      const font = segment.font || baseStyle.fontFamily
      const weight = segment.bold ? 'bold' : baseStyle.fontWeight
      const style = segment.italic ? 'italic' : (baseStyle.fontStyle || 'normal')
      const color = segment.color || baseStyle.color

      ctx.font = `${style} ${weight} ${baseStyle.fontSize}px ${font}`
      ctx.fillStyle = color

      // Aplicar uppercase se configurado
      const textToDraw = baseStyle.uppercase ? segment.text.toUpperCase() : segment.text

      // Desenhar texto
      ctx.fillText(textToDraw, currentX, currentY)

      // Medir largura do texto
      const textWidth = ctx.measureText(textToDraw).width

      // Desenhar sublinhado se necessário
      if (segment.underline) {
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        const underlineY = currentY + baseStyle.fontSize + 4
        ctx.beginPath()
        ctx.moveTo(currentX, underlineY)
        ctx.lineTo(currentX + textWidth, underlineY)
        ctx.stroke()
        ctx.restore()
      }

      currentX += textWidth
    }

    currentY += actualLineHeight
  }

  ctx.restore()

  return lines.length * actualLineHeight
}

/**
 * Divide segments em linhas respeitando maxWidth e quebras de linha
 */
function splitIntoLines(
  ctx: CanvasRenderingContext2D,
  segments: TextSegment[],
  maxWidth: number,
  baseStyle: RichTextStyle,
  maxLines: number
): TextSegment[][] {
  const lines: TextSegment[][] = []
  let currentLine: TextSegment[] = []
  let currentLineWidth = 0

  for (const segment of segments) {
    // Verificar se já atingiu maxLines
    if (lines.length >= maxLines) break

    // Tratar quebras de linha no texto
    const parts = segment.text.split('\n')

    for (let i = 0; i < parts.length; i++) {
      // Se não é a primeira parte, significa que houve uma quebra de linha
      if (i > 0) {
        if (currentLine.length > 0) {
          lines.push(currentLine)
          if (lines.length >= maxLines) break
        }
        currentLine = []
        currentLineWidth = 0
      }

      const text = parts[i]
      if (!text) continue

      // Configurar fonte para medir
      const font = segment.font || baseStyle.fontFamily
      const weight = segment.bold ? 'bold' : baseStyle.fontWeight
      const style = segment.italic ? 'italic' : (baseStyle.fontStyle || 'normal')
      ctx.font = `${style} ${weight} ${baseStyle.fontSize}px ${font}`

      // Dividir por palavras
      const words = text.split(' ')

      for (let j = 0; j < words.length; j++) {
        const word = words[j]
        const wordWithSpace = j < words.length - 1 ? word + ' ' : word
        const wordWidth = ctx.measureText(wordWithSpace).width

        // Se a palavra não cabe na linha atual
        if (currentLineWidth + wordWidth > maxWidth && currentLine.length > 0) {
          lines.push(currentLine)
          if (lines.length >= maxLines) break

          currentLine = []
          currentLineWidth = 0
        }

        // Adicionar palavra ao segmento atual ou criar novo
        const lastSeg = currentLine[currentLine.length - 1]

        if (lastSeg &&
            lastSeg.bold === segment.bold &&
            lastSeg.italic === segment.italic &&
            lastSeg.underline === segment.underline &&
            lastSeg.font === segment.font &&
            lastSeg.color === segment.color) {
          lastSeg.text += wordWithSpace
        } else {
          currentLine.push({
            text: wordWithSpace,
            bold: segment.bold,
            italic: segment.italic,
            underline: segment.underline,
            font: segment.font,
            color: segment.color
          })
        }

        currentLineWidth += wordWidth
      }
    }
  }

  // Adicionar última linha
  if (currentLine.length > 0 && lines.length < maxLines) {
    lines.push(currentLine)
  }

  return lines
}

/**
 * Mede a largura total de uma linha de segments
 */
function measureLineWidth(
  ctx: CanvasRenderingContext2D,
  line: TextSegment[],
  baseStyle: RichTextStyle
): number {
  let width = 0

  for (const segment of line) {
    const font = segment.font || baseStyle.fontFamily
    const weight = segment.bold ? 'bold' : baseStyle.fontWeight
    const style = segment.italic ? 'italic' : (baseStyle.fontStyle || 'normal')
    ctx.font = `${style} ${weight} ${baseStyle.fontSize}px ${font}`

    width += ctx.measureText(segment.text).width
  }

  return width
}
