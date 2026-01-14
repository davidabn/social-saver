import type { CarouselSlide } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts, SlideLayoutConfig } from '@/types/template'
import { CANVAS_WIDTH, CANVAS_HEIGHT, getLayoutPositions } from '@/types/carousel'
import {
  drawHeader,
  drawFooter,
  drawGrain,
  wrapText,
  drawDoubleSeparatorLines,
  drawHandDrawnArrow,
  percentToPixel,
  createCondensedFontString,
  createCustomFontString,
  renderRichText,
  htmlToPlainText
} from './base'

export async function renderTextOnlyLayout(
  ctx: CanvasRenderingContext2D,
  slide: CarouselSlide,
  template: CarouselTemplate,
  layout: SlideLayoutConfig,
  headerTexts: HeaderTexts
): Promise<void> {
  const { typography, header, decorations } = template

  // 1. Desenha cor de fundo
  ctx.fillStyle = layout.backgroundColor
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // 1.1 Desenha grain (textura granulada)
  if (slide.grainIntensity && slide.grainIntensity > 0) {
    drawGrain(ctx, slide.grainIntensity)
  }

  // 2. Desenha header (com cor ajustada ao fundo)
  drawHeader(ctx, template, headerTexts, layout.backgroundColor)

  // 2.5 Linhas separadoras duplas para template hand-drawn (acima do headline)
  const layoutPositions = getLayoutPositions(slide.customPositions, template.id, 'textOnly')
  const baseHeadlineY = layoutPositions?.headlineY !== undefined
    ? percentToPixel(layoutPositions.headlineY, 'height')
    : percentToPixel(layout.headlineArea.y, 'height') + (header.enabled ? header.height : 0)

  if (template.id === 'hand-drawn') {
    const separatorY = baseHeadlineY - 50  // 50px acima do headline
    drawDoubleSeparatorLines(ctx, separatorY, decorations.separatorColor, 120, 2, 8)
  }

  // 3. Desenha headline - CENTRALIZADO
  const headlineY = baseHeadlineY
  const headlineWidth = percentToPixel(layout.headlineArea.width, 'width')

  // Verifica se deve usar fonte alternativa (bold condensed uppercase)
  const useAltFont = layout.useAltHeadline === true
  const baseSize = useAltFont ? typography.headlineAltSize : typography.headlineSize
  // Usa tamanho do layout se definido, depois do slide, senão usa do template
  const headlineSize = layoutPositions?.headlineFontSize ?? slide.headlineFontSize ?? baseSize

  ctx.fillStyle = layout.headlineColor

  // Usa fonte customizada se definida, senão usa fonte do template
  if (layoutPositions?.headlineFontFamily) {
    ctx.font = createCustomFontString(
      headlineSize,
      layoutPositions.headlineFontFamily,
      useAltFont ? typography.headlineAltFont : typography.headlineFont,
      layoutPositions.headlineFontWeight ?? (useAltFont ? 700 : 400),
      layoutPositions.headlineFontStyle ?? 'normal'
    )
  } else if (useAltFont) {
    // Fonte BOLD CONDENSED para textOnly
    ctx.font = createCondensedFontString(
      headlineSize,
      typography.headlineAltFont,
      typography.headlineAltWeight
    )
  } else {
    // Fonte italic padrão - usa createCustomFontString para garantir resolução correta
    ctx.font = createCustomFontString(
      headlineSize,
      undefined,
      typography.headlineFont,
      typography.headlineWeight,
      typography.headlineStyle === 'italic' ? 'italic' : 'normal'
    )
  }
  // Usa alinhamento customizado do layout ou 'center' como padrão para textOnly
  const headlineAlign = layoutPositions?.headlineAlign ?? 'center'
  ctx.textAlign = headlineAlign

  // Prepara o texto (UPPERCASE se usar fonte alternativa)
  const hasHtmlFormatting = slide.headline.includes('<')
  const headlineText = useAltFont ? htmlToPlainText(slide.headline).toUpperCase() : slide.headline
  const headlineX = percentToPixel(layout.headlineArea.x, 'width')

  // Calcula posição X baseada no alinhamento
  const headlineDrawX = headlineAlign === 'center'
    ? headlineX
    : headlineAlign === 'right'
      ? CANVAS_WIDTH - headlineX
      : headlineX

  let headlineEndY: number

  // Se tem formatação HTML e não é fonte alternativa, usa renderRichText
  if (hasHtmlFormatting && !useAltFont) {
    const fontWeight = layoutPositions?.headlineFontWeight ?? 400
    const fontStyle = layoutPositions?.headlineFontStyle ?? typography.headlineStyle ?? 'normal'
    const fontFamily = layoutPositions?.headlineFontFamily ?? typography.headlineFont

    const renderedHeight = renderRichText(
      ctx,
      slide.headline,
      headlineDrawX,
      headlineY,
      headlineWidth,
      {
        fontSize: headlineSize,
        fontFamily,
        fontWeight,
        fontStyle,
        color: layout.headlineColor,
        textAlign: headlineAlign,
        lineHeight: 1.15
      },
      20
    )
    headlineEndY = headlineY + renderedHeight
  } else {
    // Renderização tradicional (sem HTML)
    const headlineLines = wrapText(ctx, headlineText, headlineWidth, 20)
    const lineHeight = headlineSize * 1.15

    headlineLines.forEach((line, index) => {
      const x = headlineAlign === 'center'
        ? CANVAS_WIDTH / 2
        : headlineAlign === 'right'
          ? CANVAS_WIDTH - headlineX
          : headlineX
      ctx.fillText(line, x, headlineY + (index * lineHeight))
    })

    // Calcular onde o headline termina
    headlineEndY = headlineY + (headlineLines.length * lineHeight)
  }

  // 4. Desenha body - CENTRALIZADO (logo após o headline)
  const bodyY = layoutPositions?.bodyY !== undefined
    ? percentToPixel(layoutPositions.bodyY, 'height')
    : headlineEndY + 30  // 30px de margem após headline
  const bodyWidth = percentToPixel(layout.bodyArea.width, 'width')

  // Usa tamanho do layout se definido, depois do slide, senão usa do template
  const bodySize = layoutPositions?.bodyFontSize ?? slide.bodyFontSize ?? typography.bodySize

  ctx.fillStyle = layout.bodyColor
  // Usa createCustomFontString para garantir resolução correta e fallback
  ctx.font = createCustomFontString(
    bodySize,
    layoutPositions?.bodyFontFamily,
    typography.bodyFont,
    layoutPositions?.bodyFontWeight ?? typography.bodyWeight,
    (layoutPositions?.bodyFontStyle || typography.bodyStyle) === 'italic' ? 'italic' : 'normal'
  )
  // Usa alinhamento customizado do layout ou 'center' como padrão para textOnly
  const bodyAlign = layoutPositions?.bodyAlign ?? 'center'
  ctx.textAlign = bodyAlign

  // Verifica se body tem formatação HTML
  const bodyHasHtml = slide.body.includes('<')
  const bodyX = percentToPixel(layout.bodyArea.x, 'width')

  // Calcula posição X baseada no alinhamento
  const bodyDrawX = bodyAlign === 'center'
    ? bodyX
    : bodyAlign === 'right'
      ? CANVAS_WIDTH - bodyX
      : bodyX

  if (bodyHasHtml) {
    const bodyFontWeight = layoutPositions?.bodyFontWeight ?? 400
    const bodyFontStyle = layoutPositions?.bodyFontStyle ?? 'normal'
    const bodyFontFamily = layoutPositions?.bodyFontFamily ?? typography.bodyFont

    renderRichText(
      ctx,
      slide.body,
      bodyDrawX,
      bodyY,
      bodyWidth,
      {
        fontSize: bodySize,
        fontFamily: bodyFontFamily,
        fontWeight: bodyFontWeight,
        fontStyle: bodyFontStyle,
        color: layout.bodyColor,
        textAlign: bodyAlign,
        lineHeight: 1.5
      },
      20
    )
  } else {
    // Renderização tradicional
    const bodyLines = wrapText(ctx, slide.body, bodyWidth, 20)
    const bodyLineHeight = bodySize * 1.5

    bodyLines.forEach((line, index) => {
      const x = bodyAlign === 'center'
        ? CANVAS_WIDTH / 2
        : bodyAlign === 'right'
          ? CANVAS_WIDTH - bodyX
          : bodyX
      ctx.fillText(line, x, bodyY + (index * bodyLineHeight))
    })
  }

  // 4.5 Seta decorativa hand-drawn (se aplicável)
  if (template.id === 'hand-drawn') {
    drawHandDrawnArrow(ctx, decorations.separatorColor)
  }

  // 5. Desenha footer (apenas slides 2+, com cor ajustada ao fundo)
  drawFooter(ctx, template, headerTexts, slide.slideNumber, layout.backgroundColor)
}
