import { useEffect, useRef, useState, useCallback } from 'react'
import type { CarouselSlide, ProfileBranding } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts } from '@/types/template'
import type { ColorPalette } from '@/templates/palettes'
import { CANVAS_WIDTH, CANVAS_HEIGHT, PREVIEW_SCALE } from '@/types/carousel'
import { renderSlideWithTemplate } from '@/templates/renderers'

const API_URL = 'http://localhost:3001/api'

function getProxyImageUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('data:')) return url
  if (url.includes('/api/proxy/')) return url
  // URLs que podem ser acessadas diretamente (não precisam de proxy)
  if (url.includes('unsplash.com') ||
      url.includes('pexels.com') ||
      url.includes('pixabay.com') ||
      url.includes('supabase.co') ||        // Supabase Storage (avatars)
      url.includes('kie.ai') ||             // Kie.ai image generation CDN
      url.includes('aiquickdraw.com') ||    // Kie.ai temp file CDN
      url.includes('replicate.delivery')    // Common AI image CDN
  ) {
    return url
  }
  return `${API_URL}/proxy/image?url=${encodeURIComponent(url)}`
}

// Tipos para drag-and-drop
type DraggableElement = 'headline' | 'body' | 'image' | 'branding'
type DragMode = 'position' | 'pan'  // 'position' move o container, 'pan' move a imagem dentro do frame

interface ElementBounds {
  element: DraggableElement
  x: number
  y: number
  width: number
  height: number
  currentYPercent: number
  currentXPercent?: number  // Para branding que move em X também
}

interface DragState {
  element: DraggableElement
  mode: DragMode
  startY: number
  startX: number  // Para branding que move em X
  startMouseY: number
  startMouseX: number
  startOffsetX: number
  startOffsetY: number
}

interface SlideCanvasProps {
  slide: CarouselSlide
  brandingText: string
  template?: CarouselTemplate
  headerTexts?: HeaderTexts
  profileBranding?: ProfileBranding
  customPalette?: ColorPalette
  isPreview?: boolean
  scale?: number
  onCanvasReady?: (canvas: HTMLCanvasElement) => void
  onPositionChange?: (updates: Partial<CarouselSlide>) => void
}

export function SlideCanvas({
  slide,
  brandingText,
  template,
  headerTexts,
  profileBranding,
  customPalette,
  isPreview = true,
  scale = PREVIEW_SCALE,
  onCanvasReady,
  onPositionChange
}: SlideCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [elementBounds, setElementBounds] = useState<ElementBounds[]>([])
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [hoveredElement, setHoveredElement] = useState<DraggableElement | null>(null)
  const [isAltPressed, setIsAltPressed] = useState(false)

  // Rastrear tecla Alt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setIsAltPressed(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setIsAltPressed(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Renderiza o slide e calcula bounds dos elementos
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const width = isPreview ? CANVAS_WIDTH * scale : CANVAS_WIDTH
    const height = isPreview ? CANVAS_HEIGHT * scale : CANVAS_HEIGHT
    canvas.width = width
    canvas.height = height

    // Scale context for preview
    if (isPreview) {
      ctx.scale(scale, scale)
    }

    // Se tiver template, usa o sistema de renderização de templates
    if (template && headerTexts) {
      renderSlideWithTemplate(ctx, slide, template, headerTexts, profileBranding, customPalette)
        .then(() => {
          // Calcular bounds dos elementos após renderização
          const bounds = calculateElementBounds(slide, template, headerTexts)
          setElementBounds(bounds)

          if (onCanvasReady) {
            onCanvasReady(canvas)
          }
        })
        .catch((error) => {
          console.error('Failed to render slide with template:', error)
          renderDefaultSlide(ctx, slide, brandingText, onCanvasReady ? () => onCanvasReady(canvas) : undefined)
        })
    } else {
      renderDefaultSlide(ctx, slide, brandingText, onCanvasReady ? () => onCanvasReady(canvas) : undefined)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide, brandingText, template, headerTexts, profileBranding, customPalette, isPreview, scale, onCanvasReady])

  // Calcula bounds dos elementos arrastáveis
  const calculateElementBounds = useCallback((
    slide: CarouselSlide,
    template: CarouselTemplate,
    _headerTexts: HeaderTexts
  ): ElementBounds[] => {
    const bounds: ElementBounds[] = []
    const layoutType = slide.layoutType || 'cover'
    const layout = template.layouts[layoutType]
    if (!layout) return bounds

    const headerOffset = template.header.enabled ? template.header.height : 0

    // Pega posições customizadas do layout atual
    const layoutPositions = slide.customPositions?.[layoutType]

    // Headline bounds
    const headlineY = layoutPositions?.headlineY !== undefined
      ? (layoutPositions.headlineY / 100) * CANVAS_HEIGHT
      : (layout.headlineArea.y / 100) * CANVAS_HEIGHT + (layoutType !== 'cover' && layoutType !== 'fullImage' ? headerOffset : 0)

    bounds.push({
      element: 'headline',
      x: (layout.headlineArea.x / 100) * CANVAS_WIDTH,
      y: headlineY,
      width: (layout.headlineArea.width / 100) * CANVAS_WIDTH,
      height: 150, // Altura aproximada do texto
      currentYPercent: layoutPositions?.headlineY ?? layout.headlineArea.y
    })

    // Body bounds
    const bodyY = layoutPositions?.bodyY !== undefined
      ? (layoutPositions.bodyY / 100) * CANVAS_HEIGHT
      : (layout.bodyArea.y / 100) * CANVAS_HEIGHT

    bounds.push({
      element: 'body',
      x: (layout.bodyArea.x / 100) * CANVAS_WIDTH,
      y: bodyY,
      width: (layout.bodyArea.width / 100) * CANVAS_WIDTH,
      height: 100,
      currentYPercent: layoutPositions?.bodyY ?? layout.bodyArea.y
    })

    // Image bounds (para todos os layouts que suportam imagem)
    if (layout.imageArea && slide.imageUrl) {
      let imageY: number
      let imageHeight: number

      if (layoutType === 'cover' || layoutType === 'fullImage') {
        // Fullscreen image
        imageY = 0
        imageHeight = CANVAS_HEIGHT
      } else if (layoutType === 'imageTop') {
        imageY = layoutPositions?.imageY !== undefined
          ? (layoutPositions.imageY / 100) * CANVAS_HEIGHT
          : (layout.imageArea.y / 100) * CANVAS_HEIGHT + headerOffset
        imageHeight = layoutPositions?.imageHeight !== undefined
          ? (layoutPositions.imageHeight / 100) * CANVAS_HEIGHT
          : ((layout.imageArea.height || 50) / 100) * CANVAS_HEIGHT
      } else if (layoutType === 'textTop') {
        imageY = (layout.imageArea.y / 100) * CANVAS_HEIGHT
        imageHeight = ((layout.imageArea.height || 65) / 100) * CANVAS_HEIGHT
      } else if (layoutType === 'textImageText') {
        imageY = layoutPositions?.imageY !== undefined
          ? (layoutPositions.imageY / 100) * CANVAS_HEIGHT
          : (layout.imageArea.y / 100) * CANVAS_HEIGHT
        imageHeight = layoutPositions?.imageHeight !== undefined
          ? (layoutPositions.imageHeight / 100) * CANVAS_HEIGHT
          : ((layout.imageArea.height || 40) / 100) * CANVAS_HEIGHT
      } else {
        return bounds
      }

      bounds.push({
        element: 'image',
        x: 0,
        y: imageY,
        width: CANVAS_WIDTH,
        height: imageHeight,
        currentYPercent: layoutPositions?.imageY ?? (layout.imageArea.y || 0)
      })
    }

    // Branding bounds (apenas no slide 1 com layout cover)
    if (slide.slideNumber === 1 && layoutType === 'cover') {
      const defaultBrandingX = layout.headlineArea.x  // Default: mesmo X do headline
      const defaultBrandingY = (layout.headlineArea.y) - 8  // Default: acima do headline

      const brandingX = layoutPositions?.brandingX ?? defaultBrandingX
      const brandingY = layoutPositions?.brandingY ?? defaultBrandingY

      bounds.push({
        element: 'branding',
        x: (brandingX / 100) * CANVAS_WIDTH,
        y: (brandingY / 100) * CANVAS_HEIGHT,
        width: 300,  // Largura aproximada do branding
        height: 70,  // Altura aproximada do branding
        currentYPercent: brandingY,
        currentXPercent: brandingX
      })
    }

    return bounds
  }, [])

  // Detecta qual elemento está sob o mouse
  const getElementAtPosition = useCallback((mouseX: number, mouseY: number): DraggableElement | null => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height

    const canvasX = (mouseX - rect.left) * scaleX
    const canvasY = (mouseY - rect.top) * scaleY

    // Ordenar por área (menor primeiro) - elementos menores têm prioridade
    // Isso garante que branding e texto sejam detectados antes de imagem fullscreen
    const sortedBounds = [...elementBounds].sort((a, b) => {
      const areaA = a.width * a.height
      const areaB = b.width * b.height
      return areaA - areaB
    })

    // Verifica cada elemento (menor área primeiro para melhor precisão)
    for (const bound of sortedBounds) {
      if (
        canvasX >= bound.x &&
        canvasX <= bound.x + bound.width &&
        canvasY >= bound.y &&
        canvasY <= bound.y + bound.height
      ) {
        return bound.element
      }
    }

    return null
  }, [elementBounds])

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!onPositionChange || !template) return

    // Detecta elemento sob o mouse
    const element = getElementAtPosition(e.clientX, e.clientY)
    if (!element) return

    const bound = elementBounds.find(b => b.element === element)
    if (!bound) return

    const layoutType = slide.layoutType || 'cover'
    const layoutPositions = slide.customPositions?.[layoutType]

    // Se é imagem e Alt está pressionado, entra em modo pan
    if (element === 'image' && isAltPressed) {
      setDragState({
        element,
        mode: 'pan',
        startY: bound.currentYPercent,
        startX: bound.currentXPercent ?? 0,
        startMouseY: e.clientY,
        startMouseX: e.clientX,
        startOffsetX: layoutPositions?.imageOffsetX ?? 0,
        startOffsetY: layoutPositions?.imageOffsetY ?? 0
      })
    } else {
      // Modo normal - mover posição
      setDragState({
        element,
        mode: 'position',
        startY: bound.currentYPercent,
        startX: bound.currentXPercent ?? 0,
        startMouseY: e.clientY,
        startMouseX: e.clientX,
        startOffsetX: 0,
        startOffsetY: 0
      })
    }
  }, [elementBounds, getElementAtPosition, onPositionChange, template, isAltPressed, slide.layoutType, slide.customPositions])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!template) return

    if (dragState) {
      // Está arrastando
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const layoutType = slide.layoutType || 'cover'

      // Modo PAN - mover imagem dentro do frame
      if (dragState.mode === 'pan' && dragState.element === 'image') {
        const deltaX = e.clientX - dragState.startMouseX
        const deltaY = e.clientY - dragState.startMouseY

        // Converte pixels para porcentagem (sensibilidade ajustada)
        const deltaPercentX = (deltaX / rect.width) * 100
        const deltaPercentY = (deltaY / rect.height) * 100

        // Limita offset baseado na escala atual
        const currentScale = slide.customPositions?.[layoutType]?.imageScale ?? 1.0
        const maxOffset = Math.max(0, (currentScale - 1) * 50)  // Quanto maior a escala, mais pode mover

        const newOffsetX = Math.max(-maxOffset, Math.min(maxOffset, dragState.startOffsetX + deltaPercentX))
        const newOffsetY = Math.max(-maxOffset, Math.min(maxOffset, dragState.startOffsetY + deltaPercentY))

        onPositionChange?.({
          customPositions: {
            ...slide.customPositions,
            [layoutType]: {
              ...slide.customPositions?.[layoutType],
              imageOffsetX: newOffsetX,
              imageOffsetY: newOffsetY
            }
          }
        })
        return
      }

      // Modo POSITION - mover container
      const deltaY = e.clientY - dragState.startMouseY
      const deltaPercent = (deltaY / rect.height) * 100
      let newY = dragState.startY + deltaPercent

      // Aplicar constraints e salvar na estrutura customPositions do layout atual
      if (dragState.element === 'headline') {
        newY = Math.max(5, Math.min(85, newY))
        onPositionChange?.({
          customPositions: {
            ...slide.customPositions,
            [layoutType]: {
              ...slide.customPositions?.[layoutType],
              headlineY: newY
            }
          }
        })
      } else if (dragState.element === 'body') {
        newY = Math.max(15, Math.min(95, newY))
        onPositionChange?.({
          customPositions: {
            ...slide.customPositions,
            [layoutType]: {
              ...slide.customPositions?.[layoutType],
              bodyY: newY
            }
          }
        })
      } else if (dragState.element === 'image') {
        newY = Math.max(0, Math.min(60, newY))
        onPositionChange?.({
          customPositions: {
            ...slide.customPositions,
            [layoutType]: {
              ...slide.customPositions?.[layoutType],
              imageY: newY
            }
          }
        })
      } else if (dragState.element === 'branding') {
        // Branding move em X e Y
        const deltaX = e.clientX - dragState.startMouseX
        const deltaPercentX = (deltaX / rect.width) * 100
        let newX = dragState.startX + deltaPercentX
        newY = Math.max(5, Math.min(70, newY))  // Constraints Y
        newX = Math.max(3, Math.min(70, newX))  // Constraints X
        onPositionChange?.({
          customPositions: {
            ...slide.customPositions,
            [layoutType]: {
              ...slide.customPositions?.[layoutType],
              brandingX: newX,
              brandingY: newY
            }
          }
        })
      }
    } else {
      // Hover - detecta elemento sob mouse
      const element = getElementAtPosition(e.clientX, e.clientY)
      setHoveredElement(element)
    }
  }, [dragState, getElementAtPosition, onPositionChange, template, slide.layoutType, slide.customPositions])

  const handleMouseUp = useCallback(() => {
    setDragState(null)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setDragState(null)
    setHoveredElement(null)
  }, [])

  // Wheel handler para zoom da imagem
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!onPositionChange || !template) return

    const element = getElementAtPosition(e.clientX, e.clientY)
    if (element !== 'image') return

    e.preventDefault()

    const layoutType = slide.layoutType || 'cover'
    const currentScale = slide.customPositions?.[layoutType]?.imageScale ?? 1.0

    // Delta do scroll (normalizado)
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newScale = Math.max(0.5, Math.min(3.0, currentScale + delta))

    onPositionChange?.({
      customPositions: {
        ...slide.customPositions,
        [layoutType]: {
          ...slide.customPositions?.[layoutType],
          imageScale: newScale
        }
      }
    })
  }, [getElementAtPosition, onPositionChange, template, slide.layoutType, slide.customPositions])

  // Double-click para resetar escala e offset da imagem
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!onPositionChange || !template) return

    const element = getElementAtPosition(e.clientX, e.clientY)
    if (element !== 'image') return

    const layoutType = slide.layoutType || 'cover'

    onPositionChange?.({
      customPositions: {
        ...slide.customPositions,
        [layoutType]: {
          ...slide.customPositions?.[layoutType],
          imageScale: 1.0,
          imageOffsetX: 0,
          imageOffsetY: 0
        }
      }
    })
  }, [getElementAtPosition, onPositionChange, template, slide.layoutType, slide.customPositions])

  // Determina o cursor
  const getCursor = () => {
    if (!template || !onPositionChange) return 'default'
    if (dragState) {
      return dragState.mode === 'pan' ? 'move' : 'grabbing'
    }
    if (hoveredElement === 'image' && isAltPressed) return 'move'
    if (hoveredElement) return 'grab'
    return 'default'
  }

  // Pega escala atual da imagem para exibir
  const layoutType = slide.layoutType || 'cover'
  const currentImageScale = slide.customPositions?.[layoutType]?.imageScale ?? 1.0

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="rounded-lg shadow-lg"
        style={{
          width: isPreview ? CANVAS_WIDTH * scale : CANVAS_WIDTH,
          height: isPreview ? CANVAS_HEIGHT * scale : CANVAS_HEIGHT,
          cursor: getCursor()
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      />

      {/* Indicador visual do elemento sendo arrastado */}
      {dragState && (
        <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
          {dragState.mode === 'pan'
            ? 'Movendo imagem dentro do frame'
            : `Arrastando: ${dragState.element === 'headline' ? 'Título' : dragState.element === 'body' ? 'Texto' : dragState.element === 'branding' ? 'Branding' : 'Imagem'}`
          }
        </div>
      )}

      {/* Indicador de escala quando hover na imagem */}
      {hoveredElement === 'image' && !dragState && onPositionChange && template && currentImageScale !== 1.0 && (
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
          {Math.round(currentImageScale * 100)}%
        </div>
      )}

      {/* Indicador de hover */}
      {hoveredElement && !dragState && onPositionChange && template && (
        <div className="absolute bottom-2 left-2 bg-muted text-muted-foreground px-2 py-1 rounded text-xs">
          {hoveredElement === 'image'
            ? (isAltPressed
                ? 'Arraste para mover a imagem | Duplo clique para resetar'
                : 'Scroll para zoom | Alt+arrastar para mover | Duplo clique para resetar')
            : hoveredElement === 'branding'
              ? 'Arraste para mover o branding'
              : `Arraste para mover ${hoveredElement === 'headline' ? 'o título' : 'o texto'}`
          }
        </div>
      )}
    </div>
  )
}

// Renderização padrão (sem template) - mantém comportamento original
function renderDefaultSlide(
  ctx: CanvasRenderingContext2D,
  slide: CarouselSlide,
  brandingText: string,
  onComplete?: () => void
) {
  // Draw background color
  ctx.fillStyle = slide.backgroundColor
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  const drawContent = () => {
    // Draw gradient overlay
    const gradient = ctx.createLinearGradient(0, CANVAS_HEIGHT * 0.3, 0, CANVAS_HEIGHT)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(0.5, `rgba(0, 0, 0, ${slide.gradientOpacity * 0.5})`)
    gradient.addColorStop(1, `rgba(0, 0, 0, ${slide.gradientOpacity})`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Draw branding text at top
    ctx.fillStyle = slide.textColor
    ctx.font = 'italic 600 42px Georgia, serif'
    ctx.textAlign = 'left'
    ctx.fillText(brandingText, 40, 70)

    // Draw headline
    ctx.font = 'bold 72px Georgia, serif'
    ctx.textAlign = 'left'
    const headlineY = CANVAS_HEIGHT - 280

    const headlineLines = wrapText(ctx, slide.headline, CANVAS_WIDTH - 80, 72)
    headlineLines.forEach((line, index) => {
      ctx.fillText(line, 40, headlineY + (index * 80))
    })

    // Draw body text
    ctx.font = '36px -apple-system, BlinkMacSystemFont, sans-serif'
    const bodyY = headlineY + (headlineLines.length * 80) + 40

    const bodyLines = wrapText(ctx, slide.body, CANVAS_WIDTH - 80, 36)
    bodyLines.forEach((line, index) => {
      ctx.fillText(line, 40, bodyY + (index * 48))
    })

    if (onComplete) {
      onComplete()
    }
  }

  if (slide.imageUrl) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const imgRatio = img.width / img.height
      const canvasRatio = CANVAS_WIDTH / CANVAS_HEIGHT

      let drawWidth, drawHeight, drawX, drawY

      if (imgRatio > canvasRatio) {
        drawHeight = CANVAS_HEIGHT
        drawWidth = img.width * (CANVAS_HEIGHT / img.height)
        drawX = (CANVAS_WIDTH - drawWidth) / 2
        drawY = 0
      } else {
        drawWidth = CANVAS_WIDTH
        drawHeight = img.height * (CANVAS_WIDTH / img.width)
        drawX = 0
        drawY = (CANVAS_HEIGHT - drawHeight) / 2
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
      drawContent()
    }
    img.onerror = () => {
      console.error('Failed to load image:', slide.imageUrl)
      drawContent()
    }
    img.src = getProxyImageUrl(slide.imageUrl) || ''
  } else {
    drawContent()
  }
}

// Helper function to wrap text
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, _fontSize?: number): string[] {
  if (!text) return []
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.slice(0, 4)
}

// Export function to generate full-resolution canvas for download
export async function generateFullResCanvas(
  slide: CarouselSlide,
  brandingText: string,
  template?: CarouselTemplate,
  headerTexts?: HeaderTexts,
  profileBranding?: ProfileBranding,
  customPalette?: ColorPalette
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }

    // Se tiver template, usa o sistema de renderização de templates
    if (template && headerTexts) {
      renderSlideWithTemplate(ctx, slide, template, headerTexts, profileBranding, customPalette)
        .then(() => resolve(canvas))
        .catch((error) => {
          console.error('Failed to render slide with template:', error)
          // Fallback para renderização padrão
          renderDefaultSlideForExport(ctx, slide, brandingText, () => resolve(canvas))
        })
    } else {
      // Renderização padrão (sem template)
      renderDefaultSlideForExport(ctx, slide, brandingText, () => resolve(canvas))
    }
  })
}

// Renderização padrão para exportação
function renderDefaultSlideForExport(
  ctx: CanvasRenderingContext2D,
  slide: CarouselSlide,
  brandingText: string,
  onComplete: () => void
) {
  ctx.fillStyle = slide.backgroundColor
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  const drawContent = () => {
    const gradient = ctx.createLinearGradient(0, CANVAS_HEIGHT * 0.3, 0, CANVAS_HEIGHT)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(0.5, `rgba(0, 0, 0, ${slide.gradientOpacity * 0.5})`)
    gradient.addColorStop(1, `rgba(0, 0, 0, ${slide.gradientOpacity})`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.fillStyle = slide.textColor
    ctx.font = 'italic 600 42px Georgia, serif'
    ctx.textAlign = 'left'
    ctx.fillText(brandingText, 40, 70)

    ctx.font = 'bold 72px Georgia, serif'
    const headlineY = CANVAS_HEIGHT - 280
    const headlineLines = wrapText(ctx, slide.headline, CANVAS_WIDTH - 80, 72)
    headlineLines.forEach((line, index) => {
      ctx.fillText(line, 40, headlineY + (index * 80))
    })

    ctx.font = '36px -apple-system, BlinkMacSystemFont, sans-serif'
    const bodyY = headlineY + (headlineLines.length * 80) + 40
    const bodyLines = wrapText(ctx, slide.body, CANVAS_WIDTH - 80, 36)
    bodyLines.forEach((line, index) => {
      ctx.fillText(line, 40, bodyY + (index * 48))
    })

    onComplete()
  }

  if (slide.imageUrl) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const imgRatio = img.width / img.height
      const canvasRatio = CANVAS_WIDTH / CANVAS_HEIGHT

      let drawWidth, drawHeight, drawX, drawY

      if (imgRatio > canvasRatio) {
        drawHeight = CANVAS_HEIGHT
        drawWidth = img.width * (CANVAS_HEIGHT / img.height)
        drawX = (CANVAS_WIDTH - drawWidth) / 2
        drawY = 0
      } else {
        drawWidth = CANVAS_WIDTH
        drawHeight = img.height * (CANVAS_WIDTH / img.width)
        drawX = 0
        drawY = (CANVAS_HEIGHT - drawHeight) / 2
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
      drawContent()
    }
    img.onerror = () => {
      drawContent()
    }
    img.src = getProxyImageUrl(slide.imageUrl) || ''
  } else {
    drawContent()
  }
}
