import type { CarouselSlide, ProfileBranding } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts, SlideLayoutType, SlideLayoutConfig } from '@/types/template'
import type { ColorPalette } from '@/templates/palettes'
import { renderCoverLayout } from './cover'
import { renderImageTopLayout } from './imageTop'
import { renderTextTopLayout } from './textTop'
import { renderFullImageLayout } from './fullImage'
import { renderTextOnlyLayout } from './textOnly'
import { renderTextImageTextLayout } from './textImageText'
import { renderImageBottomLayout } from './imageBottom'
import { renderImageLeftLayout } from './imageLeft'
import { renderImageRightLayout } from './imageRight'

// Mapa de renderizadores por tipo de layout
const renderers = {
  cover: renderCoverLayout,
  imageTop: renderImageTopLayout,
  textTop: renderTextTopLayout,
  fullImage: renderFullImageLayout,
  textOnly: renderTextOnlyLayout,
  textImageText: renderTextImageTextLayout,
  imageBottom: renderImageBottomLayout,
  imageLeft: renderImageLeftLayout,
  imageRight: renderImageRightLayout
}

// Layouts que usam backgroundAlt (fundo escuro) em vez de background
const DARK_BACKGROUND_LAYOUTS: SlideLayoutType[] = ['textOnly', 'cover', 'fullImage', 'imageBottom', 'imageLeft', 'imageRight']

// Aplica cores customizadas al layout
function applyCustomPalette(
  layout: SlideLayoutConfig,
  layoutType: SlideLayoutType,
  template: CarouselTemplate,
  customPalette?: ColorPalette
): { layout: SlideLayoutConfig; template: CarouselTemplate } {
  if (!customPalette) {
    return { layout, template }
  }

  // Determina qual cor de fundo usar
  const useDarkBg = DARK_BACKGROUND_LAYOUTS.includes(layoutType)
  const bgColor = useDarkBg ? customPalette.backgroundAlt : customPalette.background

  // Cria layout modificado com cores customizadas
  // Usa cores Alt para fundos escuros (melhor contraste)
  const modifiedLayout: SlideLayoutConfig = {
    ...layout,
    backgroundColor: bgColor,
    headlineColor: useDarkBg ? customPalette.headlineAlt : customPalette.headline,
    bodyColor: useDarkBg ? customPalette.bodyAlt : customPalette.body
  }

  // Cria template modificado com cores de decoração customizadas
  const modifiedTemplate: CarouselTemplate = {
    ...template,
    decorations: {
      ...template.decorations,
      underlineColor: customPalette.accent,
      separatorColor: customPalette.accent
    }
  }

  return { layout: modifiedLayout, template: modifiedTemplate }
}

// Função principal que renderiza um slide usando o template
export async function renderSlideWithTemplate(
  ctx: CanvasRenderingContext2D,
  slide: CarouselSlide,
  template: CarouselTemplate,
  headerTexts: HeaderTexts,
  profileBranding?: ProfileBranding,
  customPalette?: ColorPalette
): Promise<void> {
  // Determina o tipo de layout a usar
  const layoutType = slide.layoutType || getDefaultLayoutForSlide(slide.slideNumber, template)
  const originalLayout = template.layouts[layoutType]

  if (!originalLayout) {
    console.error(`Layout "${layoutType}" not found in template`)
    return
  }

  // Aplica paleta customizada se fornecida
  const { layout, template: modifiedTemplate } = applyCustomPalette(
    originalLayout,
    layoutType,
    template,
    customPalette
  )

  // Obtém o renderizador apropriado
  const renderer = renderers[layoutType]

  if (!renderer) {
    console.error(`Renderer for layout "${layoutType}" not found`)
    return
  }

  // Renderiza o slide (cover recebe branding extra)
  if (layoutType === 'cover') {
    await renderCoverLayout(ctx, slide, modifiedTemplate, layout, headerTexts, profileBranding)
  } else {
    await renderer(ctx, slide, modifiedTemplate, layout, headerTexts)
  }
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
export { renderImageBottomLayout } from './imageBottom'
export { renderImageLeftLayout } from './imageLeft'
export { renderImageRightLayout } from './imageRight'

// Re-exporta funções base úteis
export {
  drawHeader,
  drawFooter,
  drawGradientOverlay,
  drawGrain,
  drawImageCover,
  drawImageOriginalSize,
  drawImagePlaceholder,
  wrapText,
  drawTextWithUnderline,
  drawHandDrawnArrow,
  loadImage,
  percentToPixel,
  createFontString,
  createCustomFontString,
  drawProfileBranding,
  renderRichText
} from './base'