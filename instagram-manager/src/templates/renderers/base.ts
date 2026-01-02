import type { CarouselTemplate, HeaderTexts, GradientOverlayConfig } from '@/types/template'
import { CANVAS_WIDTH, CANVAS_HEIGHT, ProfileBranding } from '@/types/carousel'

const API_URL = 'http://localhost:3001/api'

// URL da imagem mockup para slides sem imagem
export const MOCKUP_IMAGE_URL = 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1080&q=80'

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
export function drawHeader(
  ctx: CanvasRenderingContext2D,
  template: CarouselTemplate,
  headerTexts: HeaderTexts
) {
  if (!template.header.enabled) return

  const { height, textColor } = template.header
  const { headerFont, headerSize } = template.typography
  const padding = 30
  const yPos = height / 2 + 5  // Posição vertical do texto

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

// Converte hex para rgba
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
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

// Carrega imagem com fallback
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
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

// Desenha branding card do perfil (foto, nome, @username)
export async function drawProfileBranding(
  ctx: CanvasRenderingContext2D,
  branding: ProfileBranding,
  x: number,
  y: number,
  textColor: string = '#FFFFFF'
): Promise<{ height: number }> {
  const avatarSize = 56
  const avatarX = x
  const avatarY = y
  const textX = avatarX + avatarSize + 16
  const nameY = avatarY + 20
  const usernameY = nameY + 26

  ctx.save()

  // 1. Desenhar foto de perfil circular (como Instagram - crop centralizado)
  if (branding.avatarUrl) {
    try {
      const avatarImg = await loadImage(branding.avatarUrl)

      // Criar clipping circular
      ctx.beginPath()
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()

      // Calcular crop centralizado mantendo aspect ratio (como Instagram)
      const imgWidth = avatarImg.naturalWidth || avatarImg.width
      const imgHeight = avatarImg.naturalHeight || avatarImg.height
      const minDim = Math.min(imgWidth, imgHeight)

      // Source: quadrado centralizado da imagem original
      const sx = (imgWidth - minDim) / 2
      const sy = (imgHeight - minDim) / 2

      // Desenhar com crop centralizado
      ctx.drawImage(
        avatarImg,
        sx, sy, minDim, minDim,  // source (crop quadrado centralizado)
        avatarX, avatarY, avatarSize, avatarSize  // destination
      )

      // Resetar clip
      ctx.restore()
      ctx.save()
    } catch (e) {
      // Fallback: círculo cinza se imagem não carregar
      console.error('Failed to load avatar:', branding.avatarUrl, e)
      ctx.fillStyle = '#666666'
      ctx.beginPath()
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  } else {
    // Sem avatar: desenhar círculo placeholder
    ctx.fillStyle = '#666666'
    ctx.beginPath()
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // 2. Desenhar nome + verificado
  ctx.fillStyle = textColor
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'

  const nameText = branding.displayName || 'Seu Nome'
  ctx.fillText(nameText, textX, nameY)

  // Checkmark verificado
  if (branding.isVerified) {
    const nameWidth = ctx.measureText(nameText).width
    const checkmarkX = textX + nameWidth + 16  // Espaçamento adequado
    const checkmarkY = nameY

    // Círculo azul
    ctx.fillStyle = '#1DA1F2'
    ctx.beginPath()
    ctx.arc(checkmarkX, checkmarkY, 10, 0, Math.PI * 2)
    ctx.fill()

    // Checkmark branco
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(checkmarkX - 4, checkmarkY)
    ctx.lineTo(checkmarkX - 1, checkmarkY + 3)
    ctx.lineTo(checkmarkX + 5, checkmarkY - 3)
    ctx.stroke()
  }

  // 3. Desenhar @username
  ctx.fillStyle = hexToRgba(textColor, 0.7)
  ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  const usernameText = branding.username ? `@${branding.username}` : '@username'
  ctx.fillText(usernameText, textX, usernameY)

  ctx.restore()

  // Retorna altura total do branding card
  return { height: avatarSize + 10 }
}
