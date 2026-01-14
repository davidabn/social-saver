import type { CarouselTemplate } from '@/types/template'
import { classicTemplate } from './classic'
import { contentCanvasTemplate } from './content-canvas'
import { handDrawnTemplate } from './hand-drawn'

// Lista de todos os templates disponíveis
export const templates: CarouselTemplate[] = [
  classicTemplate,
  contentCanvasTemplate,
  handDrawnTemplate
]

// Mapa para acesso rápido por ID
export const templatesById: Record<string, CarouselTemplate> = {
  [classicTemplate.id]: classicTemplate,
  [contentCanvasTemplate.id]: contentCanvasTemplate,
  [handDrawnTemplate.id]: handDrawnTemplate
}

// Função para buscar template por ID
export function getTemplateById(id: string): CarouselTemplate | undefined {
  return templatesById[id]
}

// Re-exporta os templates individuais
export { classicTemplate, contentCanvasTemplate, handDrawnTemplate }
