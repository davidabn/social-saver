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
  // Usa tamanho do layout se definido, depois do slide, senão usa do template
  const headlineSize = layoutPositions?.headlineFontSize ?? slide.headlineFontSize ?? baseSize

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
  // Usa alinhamento customizado do layout ou 'center' como padrão para textOnly
  const headlineAlign = layoutPositions?.headlineAlign ?? 'center'
  ctx.textAlign = headlineAlign

  // Prepara o texto (UPPERCASE se usar fonte alternativa)
  const headlineText = useAltFont ? slide.headline.toUpperCase() : slide.headline
  const headlineLines = wrapText(ctx, headlineText, headlineWidth, 20)
  const lineHeight = headlineSize * 1.15

  headlineLines.forEach((line, index) => {
    const x = headlineAlign === 'center'
      ? CANVAS_WIDTH / 2
      : headlineAlign === 'right'
        ? CANVAS_WIDTH - percentToPixel(layout.headlineArea.x, 'width')
        : percentToPixel(layout.headlineArea.x, 'width')
    ctx.fillText(line, x, headlineY + (index * lineHeight))
  })

  // Calcular onde o headline termina
  const headlineEndY = headlineY + (headlineLines.length * lineHeight)

  // 4. Desenha body - CENTRALIZADO (logo após o headline)
  const bodyY = layoutPositions?.bodyY !== undefined
    ? percentToPixel(layoutPositions.bodyY, 'height')
    : headlineEndY + 30  // 30px de margem após headline
  const bodyWidth = percentToPixel(layout.bodyArea.width, 'width')

  // Usa tamanho do layout se definido, depois do slide, senão usa do template
  const bodySize = layoutPositions?.bodyFontSize ?? slide.bodyFontSize ?? typography.bodySize

  ctx.fillStyle = layout.bodyColor
  ctx.font = `${typography.bodyWeight} ${bodySize}px ${typography.bodyFont}`
  // Usa alinhamento customizado do layout ou 'center' como padrão para textOnly
  const bodyAlign = layoutPositions?.bodyAlign ?? 'center'
  ctx.textAlign = bodyAlign

  const bodyLines = wrapText(ctx, slide.body, bodyWidth, 20)
  const bodyLineHeight = bodySize * 1.5

  bodyLines.forEach((line, index) => {
    const x = bodyAlign === 'center'
      ? CANVAS_WIDTH / 2
      : bodyAlign === 'right'
        ? CANVAS_WIDTH - percentToPixel(layout.bodyArea.x, 'width')
        : percentToPixel(layout.bodyArea.x, 'width')
    ctx.fillText(line, x, bodyY + (index * bodyLineHeight))
  })
}
