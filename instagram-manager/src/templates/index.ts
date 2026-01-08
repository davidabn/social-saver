import type { CarouselTemplate } from '@/types/template'
import { contentCanvasTemplate } from './content-canvas'
import { handDrawnTemplate } from './hand-drawn'

// Lista de todos os templates disponíveis
export const templates: CarouselTemplate[] = [
  contentCanvasTemplate,
  handDrawnTemplate
]

// Mapa para acesso rápido por ID
export const templatesById: Record<string, CarouselTemplate> = {
  [contentCanvasTemplate.id]: contentCanvasTemplate,
  [handDrawnTemplate.id]: handDrawnTemplate
}

// Função para buscar template por ID
export function getTemplateById(id: string): CarouselTemplate | undefined {
  return templatesById[id]
}

// Re-exporta os templates individuais
export { contentCanvasTemplate, handDrawnTemplate }
