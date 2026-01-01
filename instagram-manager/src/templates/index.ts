import type { CarouselTemplate } from '@/types/template'
import { brandsDecodedTemplate } from './brands-decoded'

// Lista de todos os templates disponíveis
export const templates: CarouselTemplate[] = [
  brandsDecodedTemplate
]

// Mapa para acesso rápido por ID
export const templatesById: Record<string, CarouselTemplate> = {
  [brandsDecodedTemplate.id]: brandsDecodedTemplate
}

// Função para buscar template por ID
export function getTemplateById(id: string): CarouselTemplate | undefined {
  return templatesById[id]
}

// Re-exporta os templates individuais
export { brandsDecodedTemplate }
