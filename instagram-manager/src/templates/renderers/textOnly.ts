import type { CarouselSlide } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts, SlideLayoutConfig } from '@/types/template'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/types/carousel'
import {
  drawHeader,
  wrapText,
  percentToPixel,
  createFontString,
  createCondensedFontString
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

  // Verifica se deve usar fonte alternativa (bold condensed uppercase)
  const useAltFont = layout.useAltHeadline === true
  const baseSize = useAltFont ? typography.headlineAltSize : typography.headlineSize
  const headlineSize = slide.headlineFontSize ?? baseSize

  ctx.fillStyle = layout.headlineColor

  if (useAltFont) {
    // Fonte BOLD CONDENSED para textOnly
    ctx.font = createCondensedFontString(
      headlineSize,
      typography.headlineAltFont,
      typography.headlineAltWeight
    )
  } else {
    // Fonte italic padrão
    ctx.font = createFontString(
      headlineSize,
      typography.headlineFont,
      typography.headlineWeight,
      typography.headlineStyle
    )
  }
  ctx.textAlign = 'center'  // Sempre centralizado para textOnly

  // Prepara o texto (UPPERCASE se usar fonte alternativa)
  const headlineText = useAltFont ? slide.headline.toUpperCase() : slide.headline
  const headlineLines = wrapText(ctx, headlineText, headlineWidth, 20)
  const lineHeight = headlineSize * 1.15

  headlineLines.forEach((line, index) => {
    ctx.fillText(line, CANVAS_WIDTH / 2, headlineY + (index * lineHeight))
  })

  // Calcular onde o headline termina
  const headlineEndY = headlineY + (headlineLines.length * lineHeight)

  // 4. Desenha body - CENTRALIZADO (logo após o headline)
  const bodyY = layoutPositions?.bodyY !== undefined
    ? percentToPixel(layoutPositions.bodyY, 'height')
    : headlineEndY + 30  // 30px de margem após headline
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
