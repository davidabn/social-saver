import type { CarouselSlide } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts, SlideLayoutConfig } from '@/types/template'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/types/carousel'
import {
  drawHeader,
  wrapText,
  percentToPixel,
  createFontString
} from './base'

export async function renderTextOnlyLayout(
  ctx: CanvasRenderingContext2D,
  slide: CarouselSlide,
  template: CarouselTemplate,
  layout: SlideLayoutConfig,
  headerTexts: HeaderTexts
): Promise<void> {
  const { typography, header } = template

  // 1. Desenha cor de fundo
  ctx.fillStyle = layout.backgroundColor
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // 2. Desenha header
  drawHeader(ctx, template, headerTexts)

  // 3. Desenha headline - CENTRALIZADO
  const layoutPositions = slide.customPositions?.['textOnly']
  const headlineY = layoutPositions?.headlineY !== undefined
    ? percentToPixel(layoutPositions.headlineY, 'height')
    : percentToPixel(layout.headlineArea.y, 'height') + (header.enabled ? header.height : 0)
  const headlineWidth = percentToPixel(layout.headlineArea.width, 'width')

  const headlineSize = slide.headlineFontSize ?? typography.headlineSize

  ctx.fillStyle = layout.headlineColor
  // Usa fonte ITALIC como no original
  ctx.font = createFontString(
    headlineSize,
    typography.headlineFont,
    typography.headlineWeight,
    typography.headlineStyle  // ITALIC
  )
  ctx.textAlign = 'center'  // Sempre centralizado para textOnly

  const headlineLines = wrapText(ctx, slide.headline, headlineWidth, 20)
  const lineHeight = headlineSize * 1.15

  headlineLines.forEach((line, index) => {
    ctx.fillText(line, CANVAS_WIDTH / 2, headlineY + (index * lineHeight))
  })

  // 4. Desenha body - CENTRALIZADO
  const bodyY = layoutPositions?.bodyY !== undefined
    ? percentToPixel(layoutPositions.bodyY, 'height')
    : percentToPixel(layout.bodyArea.y, 'height')
  const bodyWidth = percentToPixel(layout.bodyArea.width, 'width')

  const bodySize = slide.bodyFontSize ?? typography.bodySize

  ctx.fillStyle = layout.bodyColor
  ctx.font = `${typography.bodyWeight} ${bodySize}px ${typography.bodyFont}`
  ctx.textAlign = 'center'  // Sempre centralizado para textOnly

  const bodyLines = wrapText(ctx, slide.body, bodyWidth, 20)
  const bodyLineHeight = bodySize * 1.5

  bodyLines.forEach((line, index) => {
    ctx.fillText(line, CANVAS_WIDTH / 2, bodyY + (index * bodyLineHeight))
  })
}
