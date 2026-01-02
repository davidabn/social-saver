import type { CarouselSlide, ProfileBranding } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts, SlideLayoutConfig } from '@/types/template'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/types/carousel'
import {
  drawHeader,
  drawGradientOverlay,
  drawImageCover,
  wrapText,
  drawTextWithUnderline,
  loadImage,
  percentToPixel,
  createFontString,
  drawProfileBranding,
  MOCKUP_IMAGE_URL
} from './base'

export async function renderCoverLayout(
  ctx: CanvasRenderingContext2D,
  slide: CarouselSlide,
  template: CarouselTemplate,
  layout: SlideLayoutConfig,
  headerTexts: HeaderTexts,
  profileBranding?: ProfileBranding
): Promise<void> {
  const { typography, decorations } = template
  const layoutPositions = slide.customPositions?.['cover']

  // 1. Desenha cor de fundo
  ctx.fillStyle = layout.backgroundColor
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // 2. Desenha imagem de fundo (fullscreen)
  // Usa mockup se não tiver imagem e showMockup !== false
  const imageToUse = slide.imageUrl || (slide.showMockup !== false ? MOCKUP_IMAGE_URL : null)
  if (imageToUse && layout.imageArea) {
    try {
      const img = await loadImage(imageToUse)
      drawImageCover(
        ctx, img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT,
        layoutPositions?.imageScale ?? 1.0,
        layoutPositions?.imageOffsetX ?? 0,
        layoutPositions?.imageOffsetY ?? 0
      )
    } catch (error) {
      console.error('Failed to load image for cover layout:', error)
    }
  }

  // 3. Desenha gradient overlay (usa opacidade do slide se definida)
  const overlayConfig = {
    ...layout.gradientOverlay,
    endOpacity: slide.gradientOpacity ?? layout.gradientOverlay.endOpacity
  }
  drawGradientOverlay(ctx, overlayConfig)

  // 4. Desenha header
  drawHeader(ctx, template, headerTexts)

  // 4.5. Desenha branding card centralizado (apenas no slide 1)
  if (slide.slideNumber === 1 && profileBranding && (profileBranding.displayName || profileBranding.username)) {
    // Posição Y: usa customizada ou calcula acima do headline
    const baseHeadlineY = layoutPositions?.headlineY !== undefined
      ? layoutPositions.headlineY
      : layout.headlineArea.y
    const defaultBrandingY = baseHeadlineY - 8  // 8% acima do headline
    const brandingY = percentToPixel(layoutPositions?.brandingY ?? defaultBrandingY, 'height')

    // X é ignorado pois o branding agora é auto-centralizado
    await drawProfileBranding(
      ctx,
      profileBranding,
      0,  // x ignorado (auto-centralizado)
      brandingY,
      layout.headlineColor,
      CANVAS_WIDTH  // passa largura do canvas para centralizar
    )
  }

  // 5. Desenha headline
  const headlineX = percentToPixel(layout.headlineArea.x, 'width')
  const headlineY = layoutPositions?.headlineY !== undefined
    ? percentToPixel(layoutPositions.headlineY, 'height')
    : percentToPixel(layout.headlineArea.y, 'height')
  const headlineWidth = percentToPixel(layout.headlineArea.width, 'width')

  // Usa tamanho do layout se definido, depois do slide, senão usa do template
  const headlineSize = layoutPositions?.headlineFontSize ?? slide.headlineFontSize ?? typography.headlineSize

  ctx.fillStyle = layout.headlineColor
  ctx.font = createFontString(
    headlineSize,
    typography.headlineFont,
    typography.headlineWeight,
    typography.headlineStyle  // ITALIC
  )
  // Usa alinhamento customizado do layout ou o padrão do template
  const headlineAlign = layoutPositions?.headlineAlign ?? layout.headlineArea.align
  ctx.textAlign = headlineAlign

  const headlineLines = wrapText(ctx, slide.headline, headlineWidth, 20)
  const lineHeight = headlineSize * 1.15

  headlineLines.forEach((line, index) => {
    const x = headlineAlign === 'center'
      ? CANVAS_WIDTH / 2
      : headlineAlign === 'right'
        ? CANVAS_WIDTH - headlineX
        : headlineX

    if (decorations.underlineHeadline && slide.highlightWords?.length) {
      drawTextWithUnderline(
        ctx,
        line,
        x,
        headlineY + (index * lineHeight),
        slide.highlightWords,
        decorations.underlineColor,
        decorations.underlineThickness
      )
    } else {
      ctx.fillText(line, x, headlineY + (index * lineHeight))
    }
  })

  // Calcular onde o headline termina
  const headlineEndY = headlineY + (headlineLines.length * lineHeight)

  // 6. Desenha body - posição customizada ou dinâmica
  const bodyX = percentToPixel(layout.bodyArea.x, 'width')
  const bodyY = layoutPositions?.bodyY !== undefined
    ? percentToPixel(layoutPositions.bodyY, 'height')
    : headlineEndY + 30  // 30px de margem após headline
  const bodyWidth = percentToPixel(layout.bodyArea.width, 'width')

  // Usa tamanho do layout se definido, depois do slide, senão usa do template
  const bodySize = layoutPositions?.bodyFontSize ?? slide.bodyFontSize ?? typography.bodySize

  ctx.fillStyle = layout.bodyColor
  ctx.font = `${typography.bodyWeight} ${bodySize}px ${typography.bodyFont}`
  // Usa alinhamento customizado do layout ou o padrão do template
  const bodyAlign = layoutPositions?.bodyAlign ?? layout.bodyArea.align
  ctx.textAlign = bodyAlign

  const bodyLines = wrapText(ctx, slide.body, bodyWidth, 20)
  const bodyLineHeight = bodySize * 1.4

  bodyLines.forEach((line, index) => {
    const x = bodyAlign === 'center'
      ? CANVAS_WIDTH / 2
      : bodyAlign === 'right'
        ? CANVAS_WIDTH - bodyX
        : bodyX

    ctx.fillText(line, x, bodyY + (index * bodyLineHeight))
  })
}
