import type { SlideLayoutType } from './template'

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
