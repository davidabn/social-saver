import type { CarouselSlide } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts, SlideLayoutConfig } from '@/types/template'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/types/carousel'
import {
  drawHeader,
  drawImageCover,
  wrapText,
  drawTextWithUnderline,
  drawSeparatorLine,
  loadImage,
  percentToPixel,
  createFontString,
  MOCKUP_IMAGE_URL
} from './base'

export async function renderImageLeftLayout(
  ctx: CanvasRenderingContext2D,
  slide: CarouselSlide,
  template: CarouselTemplate,
  layout: SlideLayoutConfig,
  headerTexts: HeaderTexts
): Promise<void> {
  const { typography, decorations, header } = template
  const layoutPositions = slide.customPositions?.['imageLeft']

  // Calcular dimensões das áreas
  const imageWidth = percentToPixel(layout.imageArea?.width || 40, 'width')
  const textAreaX = imageWidth

  // 1. Desenha fundo escuro apenas na área de texto (lado direito)
  ctx.fillStyle = layout.backgroundColor
  ctx.fillRect(textAreaX, 0, CANVAS_WIDTH - textAreaX, CANVAS_HEIGHT)

  // 2. Desenha imagem no lado esquerdo (40%)
  const imageToUse = slide.imageUrl || (slide.showMockup !== false ? MOCKUP_IMAGE_URL : null)
  if (imageToUse && layout.imageArea) {
    try {
      const img = await loadImage(imageToUse)

      const imgX = percentToPixel(layout.imageArea.x, 'width')
      const imgY = percentToPixel(layout.imageArea.y, 'height')
      const imgWidth = percentToPixel(layout.imageArea.width, 'width')
      const imgHeight = percentToPixel(layout.imageArea.height || 100, 'height')

      drawImageCover(
        ctx, img, imgX, imgY, imgWidth, imgHeight,
        layoutPositions?.imageScale ?? 1.0,
        layoutPositions?.imageOffsetX ?? 0,
        layoutPositions?.imageOffsetY ?? 0
      )
    } catch (error) {
      console.error('Failed to load image for imageLeft layout:', error)
    }
  }

  // 3. Desenha header (opcional)
  drawHeader(ctx, template, headerTexts)

  // 4. Desenha headline no lado direito (topo)
  const headlineX = percentToPixel(layout.headlineArea.x, 'width')
  const headlineY = layoutPositions?.headlineY !== undefined
    ? percentToPixel(layoutPositions.headlineY, 'height')
    : percentToPixel(layout.headlineArea.y, 'height') + (header.enabled ? header.height : 0)
  const headlineWidth = percentToPixel(layout.headlineArea.width, 'width')

  // Usa tamanho do layout se definido, depois do slide, senão usa do template
  const headlineSize = layoutPositions?.headlineFontSize ?? slide.headlineFontSize ?? typography.headlineSize

  ctx.fillStyle = layout.headlineColor
  ctx.font = createFontString(
    headlineSize,
    typography.headlineFont,
    typography.headlineWeight,
    typography.headlineStyle
  )
  const headlineAlign = layoutPositions?.headlineAlign ?? layout.headlineArea.align
  ctx.textAlign = headlineAlign

  const headlineLines = wrapText(ctx, slide.headline, headlineWidth, 20)
  const lineHeight = headlineSize * 1.15

  headlineLines.forEach((line, index) => {
    const x = headlineAlign === 'center'
      ? textAreaX + (CANVAS_WIDTH - textAreaX) / 2
      : headlineAlign === 'right'
        ? CANVAS_WIDTH - (CANVAS_WIDTH - textAreaX - headlineX + textAreaX)
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

  // 5. Desenha body no lado direito (abaixo headline)
  const bodyX = percentToPixel(layout.bodyArea.x, 'width')
  const bodyY = layoutPositions?.bodyY !== undefined
    ? percentToPixel(layoutPositions.bodyY, 'height')
    : headlineEndY + 30
  const bodyWidth = percentToPixel(layout.bodyArea.width, 'width')

  // Usa tamanho do layout se definido, depois do slide, senão usa do template
  const bodySize = layoutPositions?.bodyFontSize ?? slide.bodyFontSize ?? typography.bodySize

  ctx.fillStyle = layout.bodyColor
  ctx.font = `${typography.bodyWeight} ${bodySize}px ${typography.bodyFont}`
  const bodyAlign = layoutPositions?.bodyAlign ?? layout.bodyArea.align
  ctx.textAlign = bodyAlign

  const bodyLines = wrapText(ctx, slide.body, bodyWidth, 20)
  const bodyLineHeight = bodySize * 1.4

  bodyLines.forEach((line, index) => {
    const x = bodyAlign === 'center'
      ? textAreaX + (CANVAS_WIDTH - textAreaX) / 2
      : bodyAlign === 'right'
        ? CANVAS_WIDTH - (CANVAS_WIDTH - textAreaX - bodyX + textAreaX)
        : bodyX

    ctx.fillText(line, x, bodyY + (index * bodyLineHeight))
  })

  // 6. Desenha linha separadora (opcional) - abaixo do body
  if (decorations.separatorLine) {
    const bodyEndY = bodyY + (bodyLines.length * bodyLineHeight)
    const separatorY = bodyEndY + 30
    drawSeparatorLine(
      ctx,
      separatorY,
      decorations.separatorColor,
      decorations.separatorThickness,
      headlineX,
      headlineX + 100
    )
  }
}
