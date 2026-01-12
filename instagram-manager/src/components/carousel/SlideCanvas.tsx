import { useEffect, useRef, useState, useCallback } from 'react'
import type { CarouselSlide, ProfileBranding } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts } from '@/types/template'
import type { ColorPalette } from '@/templates/palettes'
import { CANVAS_WIDTH, CANVAS_HEIGHT, PREVIEW_SCALE, getPositionKey, getLayoutPositions } from '@/types/carousel'
import { renderSlideWithTemplate, wrapText, percentToPixel, createFontString, createCondensedFontString, createCustomFontString } from '@/templates/renderers'
import { InlineTextEditor } from './InlineTextEditor'

// Estado da edição inline
interface InlineEditState {
  element: 'headline' | 'body'
  position: ElementBounds
  style: {
    fontSize: number
    fontFamily: string
    fontWeight: number | string
    fontStyle: 'normal' | 'italic'
    color: string
    textAlign: 'left' | 'center' | 'right'
    lineHeight: number
  }
}

const API_URL = 'http://localhost:3001/api'

function getProxyImageUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('data:')) return url
  if (url.includes('/api/proxy/')) return url
  // URLs que podem ser acessadas diretamente (não precisam de proxy)
  if (url.includes('unsplash.com') ||
    url.includes('pexels.com') ||
    url.includes('pixabay.com') ||
    url.includes('supabase.co') ||
    url.includes('kie.ai') ||
    url.includes('aiquickdraw.com') ||
    url.includes('replicate.delivery') ||
    url.includes('cloudinary.com') ||
    url.includes('ytimg.com') ||
    url.includes('ggpht.com') ||
    url.includes('googleusercontent.com')
  ) {
    return url
  }
  return `${API_URL}/proxy/image?url=${encodeURIComponent(url)}`
}

// Tipos para drag-and-drop
type DraggableElement = 'headline' | 'body' | 'image' | 'branding' | 'separator'
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
  isGenerating?: boolean
  onCanvasReady?: (canvas: HTMLCanvasElement) => void
  onPositionChange?: (updates: Partial<CarouselSlide>) => void
  onTextChange?: (field: 'headline' | 'body', value: string) => void
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
  isGenerating = false,
  onCanvasReady,
  onPositionChange,
  onTextChange
}: SlideCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [elementBounds, setElementBounds] = useState<ElementBounds[]>([])
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [hoveredElement, setHoveredElement] = useState<DraggableElement | null>(null)
  const [isAltPressed, setIsAltPressed] = useState(false)
  const [inlineEditState, setInlineEditState] = useState<InlineEditState | null>(null)

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

  // Refs para evitar re-renders desnecessários
  const prevCanvasSizeRef = useRef({ width: 0, height: 0, dpr: 1 })
  const onCanvasReadyRef = useRef(onCanvasReady)
  onCanvasReadyRef.current = onCanvasReady

  // Renderiza o slide e calcula bounds dos elementos
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size with high DPI support for crisp rendering
    const dpr = window.devicePixelRatio || 1
    const displayWidth = isPreview ? CANVAS_WIDTH * scale : CANVAS_WIDTH
    const displayHeight = isPreview ? CANVAS_HEIGHT * scale : CANVAS_HEIGHT
    const targetWidth = displayWidth * dpr
    const targetHeight = displayHeight * dpr

    // Só recalcula dimensões se realmente mudaram (evita limpar canvas desnecessariamente)
    const sizeChanged = prevCanvasSizeRef.current.width !== targetWidth ||
      prevCanvasSizeRef.current.height !== targetHeight ||
      prevCanvasSizeRef.current.dpr !== dpr

    if (sizeChanged) {
      canvas.width = targetWidth
      canvas.height = targetHeight
      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`
      prevCanvasSizeRef.current = { width: targetWidth, height: targetHeight, dpr }
    }

    // Limpa o canvas antes de redesenhar
    ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Scale context for high DPI + preview scale
    ctx.scale(dpr * (isPreview ? scale : 1), dpr * (isPreview ? scale : 1))

    // Se tiver template, usa o sistema de renderização de templates
    if (template && headerTexts) {
      renderSlideWithTemplate(ctx, slide, template, headerTexts, profileBranding, customPalette)
        .then(() => {
          // Calcular bounds dos elementos após renderização
          const bounds = calculateElementBounds(slide, template, headerTexts, ctx)
          setElementBounds(bounds)

          if (onCanvasReadyRef.current) {
            onCanvasReadyRef.current(canvas)
          }
        })
        .catch((error) => {
          console.error('Failed to render slide with template:', error)
          renderDefaultSlide(ctx, slide, brandingText, onCanvasReadyRef.current ? () => onCanvasReadyRef.current!(canvas) : undefined)
        })
    } else {
      renderDefaultSlide(ctx, slide, brandingText, onCanvasReadyRef.current ? () => onCanvasReadyRef.current!(canvas) : undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide, brandingText, template, headerTexts, profileBranding, customPalette, isPreview, scale])

  // Calcula bounds dos elementos arrastáveis
  const calculateElementBounds = useCallback((
    slide: CarouselSlide,
    template: CarouselTemplate,
    headerTexts: HeaderTexts,
    ctx?: CanvasRenderingContext2D
  ): ElementBounds[] => {
    const bounds: ElementBounds[] = []
    const layoutType = slide.layoutType || 'cover'
    const layout = template.layouts[layoutType]
    if (!layout) return bounds

    const headerOffset = template.header.enabled ? template.header.height : 0

    // Pega posições customizadas do layout atual (com chave composta template:layout)
    const layoutPositions = getLayoutPositions(slide.customPositions, template.id, layoutType)

    // Headline bounds
    let headlineY: number
    if (layoutPositions?.headlineY !== undefined) {
      headlineY = (layoutPositions.headlineY / 100) * CANVAS_HEIGHT
    } else if (layoutType === 'imageTop') {
      const imgYPos = layoutPositions?.imageY !== undefined
        ? (layoutPositions.imageY / 100) * CANVAS_HEIGHT
        : ((layout.imageArea?.y ?? 0) / 100) * CANVAS_HEIGHT + headerOffset
      const imgHeightVal = layoutPositions?.imageHeight !== undefined
        ? (layoutPositions.imageHeight / 100) * CANVAS_HEIGHT
        : ((layout.imageArea?.height || 50) / 100) * CANVAS_HEIGHT
      headlineY = imgYPos + imgHeightVal + 100
    } else {
      headlineY = (layout.headlineArea.y / 100) * CANVAS_HEIGHT + (layoutType !== 'cover' && layoutType !== 'fullImage' ? headerOffset : 0)
    }

    const hitPadding = 30
    const headlineWidth = (layout.headlineArea.width / 100) * CANVAS_WIDTH

    // Tenta calcular altura real do headline se tiver contexto
    let headlineHeight = 220 // fallback
    if (ctx) {
      const { typography } = template
      const useAltFont = layout.useAltHeadline === true
      const baseHeadlineSize = useAltFont ? typography.headlineAltSize : typography.headlineSize
      const fontSize = layoutPositions?.headlineFontSize ?? slide.headlineFontSize ?? baseHeadlineSize // Simplifying for bounds

      const headlineFont = layoutPositions?.headlineFontFamily
        ? createCustomFontString(fontSize, layoutPositions.headlineFontFamily, typography.headlineFont, 400)
        : useAltFont
          ? createCondensedFontString(fontSize, typography.headlineAltFont, typography.headlineAltWeight)
          : createFontString(fontSize, typography.headlineFont, typography.headlineWeight, typography.headlineStyle)

      ctx.font = headlineFont
      const headlineText = useAltFont ? (slide.headline || '').toUpperCase() : (slide.headline || '')
      // Remove tags basicas se tiver HTML
      const cleanText = headlineText.replace(/<[^>]*>/g, '')
      const lines = wrapText(ctx, cleanText, headlineWidth, 20)
      headlineHeight = lines.length * (fontSize * 1.15)
    }

    bounds.push({
      element: 'headline',
      x: (layout.headlineArea.x / 100) * CANVAS_WIDTH - hitPadding,
      y: headlineY - hitPadding,
      width: headlineWidth + hitPadding * 2,
      height: Math.max(100, headlineHeight) + hitPadding * 2,
      currentYPercent: layoutPositions?.headlineY ?? layout.headlineArea.y
    })

    // Separator bounds (se habilitado)
    if (template.decorations.separatorLine) {
      // Default position logic from renderers (e.g. imageTop)
      // separatorY = headlineEndY + 15
      const defaultSeparatorY_px = headlineY + headlineHeight + 15
      const defaultSeparatorY_percent = (defaultSeparatorY_px / CANVAS_HEIGHT) * 100

      const separatorY_percent = layoutPositions?.separatorY !== undefined
        ? layoutPositions.separatorY
        : defaultSeparatorY_percent

      const separatorY_px = (separatorY_percent / 100) * CANVAS_HEIGHT

      bounds.push({
        element: 'separator',
        x: (layout.headlineArea.x / 100) * CANVAS_WIDTH - hitPadding,
        y: separatorY_px - 15, // Hit area centrada na linha
        width: 100 + hitPadding * 2, // Hardcoded length in renderer is usually 100 or 120
        height: 30 + hitPadding, // Altura suficiente para pegar
        currentYPercent: separatorY_percent
      })
    }

    // Body bounds
    let bodyY: number
    if (layoutPositions?.bodyY !== undefined) {
      bodyY = (layoutPositions.bodyY / 100) * CANVAS_HEIGHT
    } else {
      // Fallback logic approximated
      bodyY = headlineY + headlineHeight + (template.decorations.separatorLine ? 60 : 50)
    }

    bounds.push({
      element: 'body',
      x: (layout.bodyArea.x / 100) * CANVAS_WIDTH - hitPadding,
      y: bodyY - hitPadding,
      width: (layout.bodyArea.width / 100) * CANVAS_WIDTH + hitPadding * 2,
      height: 180,
      currentYPercent: layoutPositions?.bodyY ?? layout.bodyArea.y
    })

    // Image bounds (para todos os layouts que suportam imagem)
    if (layout.imageArea && slide.imageUrl) {
      let imageX: number = 0
      let imageY: number
      let imageWidth: number = CANVAS_WIDTH
      let imageHeight: number

      // ... same logic for image calculation ...
      // Copying existing logic for image bounds:
      if (layoutType === 'cover' || layoutType === 'fullImage') {
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
        imageY = layoutPositions?.imageY !== undefined
          ? (layoutPositions.imageY / 100) * CANVAS_HEIGHT
          : (layout.imageArea.y / 100) * CANVAS_HEIGHT
        imageHeight = layoutPositions?.imageHeight !== undefined
          ? (layoutPositions.imageHeight / 100) * CANVAS_HEIGHT
          : ((layout.imageArea.height || 65) / 100) * CANVAS_HEIGHT
      } else if (layoutType === 'textImageText') {
        imageY = layoutPositions?.imageY !== undefined
          ? (layoutPositions.imageY / 100) * CANVAS_HEIGHT
          : (layout.imageArea.y / 100) * CANVAS_HEIGHT
        imageHeight = layoutPositions?.imageHeight !== undefined
          ? (layoutPositions.imageHeight / 100) * CANVAS_HEIGHT
          : ((layout.imageArea.height || 40) / 100) * CANVAS_HEIGHT
      } else if (layoutType === 'imageBottom') {
        imageY = layoutPositions?.imageY !== undefined
          ? (layoutPositions.imageY / 100) * CANVAS_HEIGHT
          : (layout.imageArea.y / 100) * CANVAS_HEIGHT
        imageHeight = layoutPositions?.imageHeight !== undefined
          ? (layoutPositions.imageHeight / 100) * CANVAS_HEIGHT
          : ((layout.imageArea.height || 40) / 100) * CANVAS_HEIGHT
      } else if (layoutType === 'imageLeft') {
        imageX = (layout.imageArea.x / 100) * CANVAS_WIDTH
        imageY = (layout.imageArea.y / 100) * CANVAS_HEIGHT
        imageWidth = ((layout.imageArea.width || 40) / 100) * CANVAS_WIDTH
        imageHeight = ((layout.imageArea.height || 100) / 100) * CANVAS_HEIGHT
      } else if (layoutType === 'imageRight') {
        imageX = (layout.imageArea.x / 100) * CANVAS_WIDTH
        imageY = (layout.imageArea.y / 100) * CANVAS_HEIGHT
        imageWidth = ((layout.imageArea.width || 40) / 100) * CANVAS_WIDTH
        imageHeight = ((layout.imageArea.height || 100) / 100) * CANVAS_HEIGHT
      } else {
        return bounds
      }

      bounds.push({
        element: 'image',
        x: imageX,
        y: imageY,
        width: imageWidth,
        height: imageHeight,
        currentYPercent: layoutPositions?.imageY ?? (layout.imageArea.y || 0)
      })
    }

    // Branding bounds
    if (slide.slideNumber === 1 && layoutType === 'cover') {
      const defaultBrandingX = layout.headlineArea.x
      const defaultBrandingY = (layout.headlineArea.y) - 8

      const brandingX = layoutPositions?.brandingX ?? defaultBrandingX
      const brandingY = layoutPositions?.brandingY ?? defaultBrandingY

      bounds.push({
        element: 'branding',
        x: (brandingX / 100) * CANVAS_WIDTH - hitPadding,
        y: (brandingY / 100) * CANVAS_HEIGHT - hitPadding,
        width: 450 + hitPadding * 2,
        height: 150,
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
    const positionKey = getPositionKey(template.id, layoutType)
    const layoutPositions = getLayoutPositions(slide.customPositions, template.id, layoutType) || {} // Garante obj vazio se undefined

    // --- FREEZE LAYOUT LOGIC ---
    // Antes de começar a arrastar, verificamos se os elementos já têm posições fixas.
    // Se não tiverem (estão usando layout relativo), "congelamos" suas posições atuais
    // salvando-as em customPositions. Isso impede que mover um elemento (ex: headline)
    // afete os outros (ex: body) indesejadamente devido ao layout relativo.
    const fixedUpdates: Record<string, any> = {}
    let needsFreeze = false

    elementBounds.forEach(b => {
      // Headline
      if (b.element === 'headline' && layoutPositions.headlineY === undefined) {
        fixedUpdates.headlineY = b.currentYPercent
        needsFreeze = true
      }
      // Body
      else if (b.element === 'body' && layoutPositions.bodyY === undefined) {
        fixedUpdates.bodyY = b.currentYPercent
        needsFreeze = true
      }
      // Image
      else if (b.element === 'image' && layoutPositions.imageY === undefined) {
        fixedUpdates.imageY = b.currentYPercent
        needsFreeze = true
      }
      // Branding
      else if (b.element === 'branding') {
        if (layoutPositions.brandingY === undefined) {
          fixedUpdates.brandingY = b.currentYPercent
          needsFreeze = true
        }
        if (layoutPositions.brandingX === undefined && b.currentXPercent !== undefined) {
          fixedUpdates.brandingX = b.currentXPercent
          needsFreeze = true
        }
      }
      // Separator
      else if (b.element === 'separator') {
        if (layoutPositions.separatorY === undefined) {
          fixedUpdates.separatorY = b.currentYPercent
          needsFreeze = true
        }
      }
    })

    // Se detectamos dependências relativas, aplicamos o congelamento
    if (needsFreeze) {
      onPositionChange({
        customPositions: {
          ...slide.customPositions,
          [positionKey]: {
            ...layoutPositions,
            ...fixedUpdates
          }
        }
      })
      // O re-render subsequente atualizará o 'slide' usado no handleMouseMove,
      // garantindo que os movimentos subsequentes respeitem essas posições fixas.
    }
    // ---------------------------

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
      const positionKey = getLayoutPositions(slide.customPositions, template.id, layoutType) ? getPositionKey(template.id, layoutType) : ''
      const layoutPositions = getLayoutPositions(slide.customPositions, template.id, layoutType)

      // Modo PAN - mover imagem dentro do frame
      if (dragState.mode === 'pan' && dragState.element === 'image') {
        const deltaX = e.clientX - dragState.startMouseX
        const deltaY = e.clientY - dragState.startMouseY

        // Converte pixels para porcentagem (sensibilidade ajustada)
        const deltaPercentX = (deltaX / rect.width) * 100
        const deltaPercentY = (deltaY / rect.height) * 100

        // Limita offset baseado na escala atual
        // Permite offset mínimo de 30 mesmo sem zoom (importante para hand-drawn)
        const currentScale = layoutPositions?.imageScale ?? 1.0
        const maxOffset = Math.max(30, (currentScale - 1) * 50 + 30)

        const newOffsetX = Math.max(-maxOffset, Math.min(maxOffset, (dragState.startOffsetX || 0) + deltaPercentX))
        const newOffsetY = Math.max(-maxOffset, Math.min(maxOffset, (dragState.startOffsetY || 0) + deltaPercentY))

        onPositionChange?.({
          customPositions: {
            ...slide.customPositions,
            [getPositionKey(template.id, layoutType)]: {
              ...layoutPositions,
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
            [getPositionKey(template.id, layoutType)]: {
              ...layoutPositions,
              headlineY: newY
            }
          }
        })
      } else if (dragState.element === 'body') {
        newY = Math.max(15, Math.min(95, newY))
        onPositionChange?.({
          customPositions: {
            ...slide.customPositions,
            [getPositionKey(template.id, layoutType)]: {
              ...layoutPositions,
              bodyY: newY
            }
          }
        })
      } else if (dragState.element === 'image') {
        newY = Math.max(0, Math.min(60, newY))
        onPositionChange?.({
          customPositions: {
            ...slide.customPositions,
            [getPositionKey(template.id, layoutType)]: {
              ...layoutPositions,
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
            [getPositionKey(template.id, layoutType)]: {
              ...layoutPositions,
              brandingX: newX,
              brandingY: newY
            }
          }
        })
      } else if (dragState.element === 'separator') {
        // Separator move apenas em Y
        newY = Math.max(10, Math.min(90, newY))
        onPositionChange?.({
          customPositions: {
            ...slide.customPositions,
            [getPositionKey(template.id, layoutType)]: {
              ...layoutPositions,
              separatorY: newY
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
    const layoutPositions = getLayoutPositions(slide.customPositions, template.id, layoutType)
    const currentScale = layoutPositions?.imageScale ?? 1.0

    // Delta do scroll (normalizado)
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newScale = Math.max(0.5, Math.min(3.0, currentScale + delta))

    onPositionChange?.({
      customPositions: {
        ...slide.customPositions,
        [getPositionKey(template.id, layoutType)]: {
          ...layoutPositions,
          imageScale: newScale
        }
      }
    })
  }, [getElementAtPosition, onPositionChange, template, slide.layoutType, slide.customPositions])

  // Double-click para editar texto inline ou resetar imagem
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!template) return

    const element = getElementAtPosition(e.clientX, e.clientY)
    if (!element) return

    const layoutType = slide.layoutType || 'cover'
    const layoutPositions = getLayoutPositions(slide.customPositions, template.id, layoutType)

    // Para headline ou body, abre editor inline
    if ((element === 'headline' || element === 'body') && onTextChange) {
      const bound = elementBounds.find(b => b.element === element)
      if (!bound) return

      const layout = template.layouts[layoutType]

      // Pegar estilo do texto
      const isHeadline = element === 'headline'
      const fontSize = isHeadline
        ? (layoutPositions?.headlineFontSize ?? slide.headlineFontSize ?? template.typography.headlineSize)
        : (layoutPositions?.bodyFontSize ?? slide.bodyFontSize ?? template.typography.bodySize)
      const fontFamily = isHeadline
        ? (layoutPositions?.headlineFontFamily ?? template.typography.headlineFont)
        : (layoutPositions?.bodyFontFamily ?? template.typography.bodyFont)
      const fontWeight = isHeadline
        ? (layoutPositions?.headlineFontWeight ?? template.typography.headlineWeight ?? 700)
        : (layoutPositions?.bodyFontWeight ?? template.typography.bodyWeight ?? 400)
      const fontStyle: 'normal' | 'italic' = isHeadline
        ? ((layoutPositions?.headlineFontStyle ?? template.typography.headlineStyle ?? 'normal') as 'normal' | 'italic')
        : ((layoutPositions?.bodyFontStyle ?? 'normal') as 'normal' | 'italic')
      const textAlign = isHeadline
        ? (layoutPositions?.headlineAlign ?? layout?.headlineArea?.align ?? 'left')
        : (layoutPositions?.bodyAlign ?? layout?.bodyArea?.align ?? 'left')
      const color = isHeadline ? (layout?.headlineColor ?? '#ffffff') : (layout?.bodyColor ?? '#ffffff')

      const hitPadding = 30
      const cleanPosition = {
        ...bound,
        x: bound.x + hitPadding,
        y: bound.y + hitPadding,
        width: bound.width - (hitPadding * 2),
        height: bound.height
      }

      setInlineEditState({
        element,
        position: cleanPosition,
        style: {
          fontSize,
          fontFamily,
          fontWeight,
          fontStyle,
          color,
          textAlign,
          lineHeight: isHeadline ? 1.15 : 1.4
        }
      })
      return
    }

    // Para imagem, resetar escala e offset
    if (element === 'image' && onPositionChange) {
      onPositionChange?.({
        customPositions: {
          ...slide.customPositions,
          [getPositionKey(template.id, layoutType)]: {
            ...layoutPositions,
            imageScale: 1.0,
            imageOffsetX: 0,
            imageOffsetY: 0
          }
        }
      })
    }
  }, [getElementAtPosition, onPositionChange, onTextChange, template, slide, elementBounds])

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
  const currentLayoutPositions = getLayoutPositions(slide.customPositions, template?.id, layoutType)
  const currentImageScale = currentLayoutPositions?.imageScale ?? 1.0

  // Hook para sincronizar posição do editor quando os bounds mudam (ex: ao trocar fonte e o texto reflow)
  useEffect(() => {
    if (inlineEditState) {
      const bound = elementBounds.find(b => b.element === inlineEditState.element)
      if (bound) {
        const hitPadding = 30
        const cleanPosition = {
          ...bound,
          x: bound.x + hitPadding,
          y: bound.y + hitPadding,
          width: bound.width - (hitPadding * 2),
          height: bound.height
        }

        // Só atualiza se mudou significativamente para evitar loop
        if (
          Math.abs(cleanPosition.x - inlineEditState.position.x) > 1 ||
          Math.abs(cleanPosition.y - inlineEditState.position.y) > 1 ||
          Math.abs(cleanPosition.width - inlineEditState.position.width) > 1 ||
          Math.abs(cleanPosition.height - inlineEditState.position.height) > 1
        ) {
          setInlineEditState(prev => prev ? ({
            ...prev,
            position: cleanPosition
          }) : null)
        }
      }
    }
  }, [elementBounds, inlineEditState?.element])

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

      {/* Overlay de loading durante geração de imagem IA */}
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg animate-pulse">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '1.5s' }}></div>
            <span className="text-white text-sm font-medium drop-shadow-lg">Gerando imagem...</span>
          </div>
        </div>
      )}

      {/* Indicador visual do elemento sendo arrastado */}
      {dragState && (
        <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
          {dragState.mode === 'pan'
            ? 'Movendo imagem dentro do frame'
            : `Arrastando: ${dragState.element === 'headline' ? 'Título' : dragState.element === 'body' ? 'Texto' : dragState.element === 'branding' ? 'Branding' : dragState.element === 'separator' ? 'Linha' : 'Imagem'}`
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
      {hoveredElement && !dragState && onPositionChange && template && !inlineEditState && (
        <div className="absolute bottom-2 left-2 bg-muted text-muted-foreground px-2 py-1 rounded text-xs">
          {hoveredElement === 'image'
            ? (isAltPressed
              ? 'Arraste para mover a imagem | Duplo clique para resetar'
              : 'Scroll para zoom | Alt+arrastar para mover | Duplo clique para resetar')
            : hoveredElement === 'branding'
              ? 'Arraste para mover o branding'
              : `Arraste para mover | Duplo clique para editar ${hoveredElement === 'headline' ? 'o título' : 'o texto'}`
          }
        </div>
      )}

      {/* Editor de texto inline */}
      {inlineEditState && onTextChange && canvasRef.current && (
        <InlineTextEditor
          value={inlineEditState.element === 'headline' ? slide.headline : slide.body}
          onChange={(newValue) => {
            onTextChange(inlineEditState.element, newValue)
          }}
          onStyleChange={(newStyle) => {
            if (!template || !onPositionChange) return

            const layoutType = slide.layoutType || 'cover'
            const positionKey = getPositionKey(template.id, layoutType)
            const layoutPositions = getLayoutPositions(slide.customPositions, template.id, layoutType)

            // Mapear estilo para propriedade do layout
            const updates: Record<string, any> = {}
            if (newStyle.fontFamily) {
              updates[inlineEditState.element === 'headline' ? 'headlineFontFamily' : 'bodyFontFamily'] = newStyle.fontFamily
            }
            if (newStyle.color) {
              // cores podem ser styles do layout ou propriedades do slide?
              // SlideEditor usa layoutPositions para tudo customizavel por elemento
              // Mas cor pode ser global do slide se nao houver override
              // Vamos assumir override no layout se possivel, ou atualizar o slide se for padrao
              // Por simplificacao, vamos atualizar no layout positions que tem prioridade
              // Mas note que cores base estao no slide.textColor/backgroundColor
              // O renderer checa: layout?.headlineColor ?? slide.textColor
              // Entao precisamos adicionar headlineColor/bodyColor ao layoutPositions se quisermos override especifico
              // Ou atualizar slide.textColor se for o body e for a cor principal

              // Por seguranca e consistencia com o resto do editor inline, vamos assumir que o usuario quer mudar a cor DESSE elemento
              updates[inlineEditState.element === 'headline' ? 'headlineColor' : 'bodyColor'] = newStyle.color
            }

            onPositionChange({
              customPositions: {
                ...slide.customPositions,
                [positionKey]: {
                  ...layoutPositions,
                  ...updates
                }
              }
            })

            // Atualizar estado local para refletir imediatamente
            setInlineEditState(prev => prev ? ({
              ...prev,
              style: {
                ...prev.style,
                ...newStyle
              }
            }) : null)
          }}
          position={inlineEditState.position}
          style={inlineEditState.style}
          canvasRect={canvasRef.current.getBoundingClientRect()}
          onClose={() => setInlineEditState(null)}
        />
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