import type { CarouselSlide } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts, SlideLayoutConfig } from '@/types/template'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/types/carousel'
import {
  drawHeader,
  drawImageCover,
  wrapText,
  drawTextWithUnderline,
  loadImage,
  percentToPixel,
  createFontString
} from './base'

export async function renderTextImageTextLayout(
  ctx: CanvasRenderingContext2D,
  slide: CarouselSlide,
  template: CarouselTemplate,
  layout: SlideLayoutConfig,
  headerTexts: HeaderTexts
): Promise<void> {
  const { typography, decorations, header } = template
  const layoutPositions = slide.customPositions?.['textImageText']

  // 1. Desenha cor de fundo
  ctx.fillStyle = layout.backgroundColor
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // 2. Desenha header
  drawHeader(ctx, template, headerTexts)

  // 3. Calcula offset do header
  const headerOffset = header.enabled ? header.height : 0

  // 4. Desenha headline no topo
  const headlineX = percentToPixel(layout.headlineArea.x, 'width')
  const headlineY = layoutPositions?.headlineY !== undefined
    ? percentToPixel(layoutPositions.headlineY, 'height')
    : percentToPixel(layout.headlineArea.y, 'height') + headerOffset
  const headlineWidth = percentToPixel(layout.headlineArea.width, 'width')

  const headlineSize = slide.headlineFontSize ?? typography.headlineSize

  ctx.fillStyle = layout.headlineColor
  ctx.font = createFontString(
    headlineSize,
    typography.headlineFont,
    typography.headlineWeight,
    typography.headlineStyle
  )
  ctx.textAlign = layout.headlineArea.align

  const headlineLines = wrapText(ctx, slide.headline, headlineWidth, 20)
  const lineHeight = headlineSize * 1.15

  headlineLines.forEach((line, index) => {
    const x = layout.headlineArea.align === 'center'
      ? CANVAS_WIDTH / 2
      : layout.headlineArea.align === 'right'
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

  // 5. Desenha imagem no meio (com bordas arredondadas)
  if (slide.imageUrl && layout.imageArea) {
    try {
      const img = await loadImage(slide.imageUrl)

      const imgMargin = 20
      const imgRadius = 20
      const imgY = layoutPositions?.imageY !== undefined
        ? percentToPixel(layoutPositions.imageY, 'height')
        : percentToPixel(layout.imageArea.y, 'height')
      const imgHeight = layoutPositions?.imageHeight !== undefined
        ? percentToPixel(layoutPositions.imageHeight, 'height')
        : percentToPixel(layout.imageArea.height || 40, 'height')

      // Bordas arredondadas para a imagem
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(imgMargin, imgY, CANVAS_WIDTH - imgMargin * 2, imgHeight, imgRadius)
      ctx.clip()
      drawImageCover(
        ctx, img, imgMargin, imgY, CANVAS_WIDTH - imgMargin * 2, imgHeight,
        layoutPositions?.imageScale ?? 1.0,
        layoutPositions?.imageOffsetX ?? 0,
        layoutPositions?.imageOffsetY ?? 0
      )
      ctx.restore()
    } catch (error) {
      console.error('Failed to load image for textImageText layout:', error)
    }
  }

  // 6. Desenha body embaixo da imagem
  const bodyX = percentToPixel(layout.bodyArea.x, 'width')
  const bodyY = layoutPositions?.bodyY !== undefined
    ? percentToPixel(layoutPositions.bodyY, 'height')
    : percentToPixel(layout.bodyArea.y, 'height')
  const bodyWidth = percentToPixel(layout.bodyArea.width, 'width')

  const bodySize = slide.bodyFontSize ?? typography.bodySize

  ctx.fillStyle = layout.bodyColor
  ctx.font = `${typography.bodyWeight} ${bodySize}px ${typography.bodyFont}`
  ctx.textAlign = layout.bodyArea.align

  const bodyLines = wrapText(ctx, slide.body, bodyWidth, 20)
  const bodyLineHeight = bodySize * 1.5

  bodyLines.forEach((line, index) => {
    const x = layout.bodyArea.align === 'center'
      ? CANVAS_WIDTH / 2
      : layout.bodyArea.align === 'right'
        ? CANVAS_WIDTH - bodyX
        : bodyX

    ctx.fillText(line, x, bodyY + (index * bodyLineHeight))
  })
}
