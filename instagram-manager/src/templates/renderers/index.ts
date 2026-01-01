import type { CarouselSlide } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts, SlideLayoutType } from '@/types/template'
import { renderCoverLayout } from './cover'
import { renderImageTopLayout } from './imageTop'
import { renderTextTopLayout } from './textTop'
import { renderFullImageLayout } from './fullImage'
import { renderTextOnlyLayout } from './textOnly'
import { renderTextImageTextLayout } from './textImageText'

// Mapa de renderizadores por tipo de layout
const renderers = {
  cover: renderCoverLayout,
  imageTop: renderImageTopLayout,
  textTop: renderTextTopLayout,
  fullImage: renderFullImageLayout,
  textOnly: renderTextOnlyLayout,
  textImageText: renderTextImageTextLayout
}

// Função principal que renderiza um slide usando o template
export async function renderSlideWithTemplate(
  ctx: CanvasRenderingContext2D,
  slide: CarouselSlide,
  template: CarouselTemplate,
  headerTexts: HeaderTexts
): Promise<void> {
  // Determina o tipo de layout a usar
  const layoutType = slide.layoutType || getDefaultLayoutForSlide(slide.slideNumber, template)
  const layout = template.layouts[layoutType]

  if (!layout) {
    console.error(`Layout "${layoutType}" not found in template`)
    return
  }

  // Obtém o renderizador apropriado
  const renderer = renderers[layoutType]

  if (!renderer) {
    console.error(`Renderer for layout "${layoutType}" not found`)
    return
  }

  // Renderiza o slide
  await renderer(ctx, slide, template, layout, headerTexts)
}

// Retorna o layout padrão para um slide baseado na sua posição
export function getDefaultLayoutForSlide(
  slideNumber: number,
  template: CarouselTemplate
): SlideLayoutType {
  const index = slideNumber - 1
  const sequence = template.defaultLayoutSequence

  if (index >= 0 && index < sequence.length) {
    return sequence[index]
  }

  // Se não houver layout definido para essa posição, usa o mais comum
  return 'imageTop'
}

// Re-exporta os renderizadores individuais
export { renderCoverLayout } from './cover'
export { renderImageTopLayout } from './imageTop'
export { renderTextTopLayout } from './textTop'
export { renderFullImageLayout } from './fullImage'
export { renderTextOnlyLayout } from './textOnly'
export { renderTextImageTextLayout } from './textImageText'

// Re-exporta funções base úteis
export {
  drawHeader,
  drawGradientOverlay,
  wrapText,
  loadImage,
  getProxyImageUrl
} from './base'
