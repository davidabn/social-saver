import type { SlideLayoutType } from './template'

// Rich text segment with formatting
export interface TextSegment {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  font?: string       // Override de fonte
  color?: string      // Override de cor
}

// Helper type for rich text (retrocompatível com string)
export type RichText = string | TextSegment[]

// Helper para converter string para TextSegment[]
export function toTextSegments(text: RichText): TextSegment[] {
  if (typeof text === 'string') {
    return [{ text }]
  }
  return text
}

// Helper para converter TextSegment[] para string plain
export function toPlainText(text: RichText): string {
  if (typeof text === 'string') {
    return text
  }
  return text.map(s => s.text).join('')
}

// Helper para gerar chave de customPositions isolada por template
// Formato: "templateId:layoutType" ou apenas "layoutType" se não houver template
export function getPositionKey(templateId: string | undefined, layoutType: string): string {
  return templateId ? `${templateId}:${layoutType}` : layoutType
}

// Helper para buscar customPositions com fallback para chave antiga (compatibilidade)
export function getLayoutPositions(
  customPositions: CarouselSlide['customPositions'],
  templateId: string | undefined,
  layoutType: string
) {
  if (!customPositions) return undefined

  // Primeiro tenta chave nova (template:layout)
  const newKey = getPositionKey(templateId, layoutType)
  if (customPositions[newKey]) {
    return customPositions[newKey]
  }

  // Fallback para chave antiga (apenas layout) - compatibilidade com dados existentes
  return customPositions[layoutType]
}

export interface CarouselSlide {
  id: string
  slideNumber: number
  headline: string
  body: string
  imageUrl: string | null
  imageSearchQuery: string
  backgroundColor: string
  gradientColor: string
  gradientOpacity: number
  textColor: string
  grainIntensity?: number  // 0-100, intensidade da textura granulada
  // Campos para templates
  layoutType?: SlideLayoutType
  highlightWords?: string[]  // Palavras para destacar (sublinhado)
  showMockup?: boolean  // Mostrar imagem mockup quando não há imagem (default: true)
  // Controle de tamanho de fonte (sobrescreve template)
  headlineFontSize?: number
  bodyFontSize?: number
  // Posições customizadas por layout (em %)
  customPositions?: {
    [layoutType: string]: {
      headlineY?: number
      bodyY?: number
      imageY?: number
      imageHeight?: number
      // Controle de escala e posição da imagem dentro do frame
      imageScale?: number     // Escala (1.0 = 100%, 0.5 = 50%, 3.0 = 300%)
      imageOffsetX?: number   // Offset X em % (-50 a 50)
      imageOffsetY?: number   // Offset Y em % (-50 a 50)
      // Posição do branding card (apenas slide 1)
      brandingX?: number      // Posição X em % (0-100)
      brandingY?: number      // Posição Y em % (0-100)
      brandingScale?: number  // Escala do branding (0.5-2.0, 1.0 = 100%)
      // Controle de alinhamento de texto POR LAYOUT (sobrescreve template)
      headlineAlign?: 'left' | 'center' | 'right'
      bodyAlign?: 'left' | 'center' | 'right'
      // Tamanho de fonte POR LAYOUT (sobrescreve template)
      headlineFontSize?: number
      bodyFontSize?: number
      // Fonte customizada POR LAYOUT
      headlineFontFamily?: string      // Nome da fonte (ex: "Montserrat")
      headlineFontWeight?: number      // Peso (400, 500, 600, 700, etc)
      headlineFontStyle?: 'normal' | 'italic'
      bodyFontFamily?: string
      bodyFontWeight?: number
      bodyFontStyle?: 'normal' | 'italic'
      separatorY?: number  // Posição Y da linha separadora em %
    }
  }
}

export interface CarouselDesign {
  id: string
  name: string
  brandingText: string
  brandingLogo: string | null
  slides: CarouselSlide[]
  width: number
  height: number
  theme: string
  // Campos para templates
  templateId?: string
  headerLeft?: string
  headerCenter?: string
  headerRight?: string
}

export interface GeneratedSlide {
  slideNumber: number
  headline: string
  body: string
  imageSearchQuery: string
  imageUrl?: string | null
}

export interface ImageSearchResult {
  url: string
  title: string
  source: string
}

export interface GenerateSlidesResponse {
  slides: GeneratedSlide[]
}

export interface SearchImagesResponse {
  images: ImageSearchResult[]
}

// Default values for new slides
export const DEFAULT_SLIDE: Omit<CarouselSlide, 'id' | 'slideNumber'> = {
  headline: '',
  body: '',
  imageUrl: null,
  imageSearchQuery: '',
  backgroundColor: '#000000',
  gradientColor: '#000000',
  gradientOpacity: 1.0,
  textColor: '#FFFFFF',
  grainIntensity: 0,
  showMockup: true
}

export const DEFAULT_DESIGN: Omit<CarouselDesign, 'id'> = {
  name: 'Novo Carrossel',
  brandingText: 'Seu Brand',
  brandingLogo: null,
  slides: [],
  width: 1080,
  height: 1350,
  theme: ''
}

// Canvas dimensions for Instagram carousel
export const CANVAS_WIDTH = 1080
export const CANVAS_HEIGHT = 1350
export const PREVIEW_SCALE = 0.4 // Scale for preview display

// Profile branding for first slide
export interface ProfileBranding {
  displayName: string       // "David Facundo"
  username: string          // "davidabn_" (without @)
  avatarUrl: string | null  // Profile photo URL
  isVerified?: boolean      // Show blue checkmark
}
