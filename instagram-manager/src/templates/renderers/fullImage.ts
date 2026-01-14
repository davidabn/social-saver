import type { CarouselSlide } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts, SlideLayoutConfig } from '@/types/template'
import { CANVAS_WIDTH, CANVAS_HEIGHT, getLayoutPositions } from '@/types/carousel'
import {
  drawHeader,
  drawFooter,
  drawGradientOverlay,
  drawGrain,
  drawImageCover,
  drawImagePlaceholder,
  wrapText,
  drawTextWithUnderline,
  drawHandDrawnArrow,
  loadImage,
  percentToPixel,
  createCondensedFontString,
  createCustomFontString,
  renderRichText,
  htmlToPlainText
} from './base'

export async function renderFullImageLayout(
  ctx: CanvasRenderingContext2D,
  slide: CarouselSlide,
  template: CarouselTemplate,
  layout: SlideLayoutConfig,
  headerTexts: HeaderTexts
): Promise<void> {
  const { typography, decorations } = template
  const layoutPositions = getLayoutPositions(slide.customPositions, template.id, 'fullImage')

  // 1. Desenha cor de fundo
  ctx.fillStyle = layout.backgroundColor
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // 1.1 Desenha grain (textura granulada)
  if (slide.grainIntensity && slide.grainIntensity > 0) {
    drawGrain(ctx, slide.grainIntensity)
  }

  // 2. Desenha imagem fullscreen
  if (slide.imageUrl && layout.imageArea) {
    try {
      const img = await loadImage(slide.imageUrl)
      drawImageCover(
        ctx, img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT,
        layoutPositions?.imageScale ?? 1.0,
        layoutPositions?.imageOffsetX ?? 0,
        layoutPositions?.imageOffsetY ?? 0
      )
    } catch (error) {
      console.error('Failed to load image for fullImage layout:', error)
      // Se falhar ao carregar, desenha placeholder
      drawImagePlaceholder(ctx, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0)
    }
  } else if (layout.imageArea) {
    // Sem imagem definida - desenha placeholder visual
    drawImagePlaceholder(ctx, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0)
  }

  // 3. Desenha gradient overlay (usa opacidade do slide se definida)
  const overlayConfig = {
    ...layout.gradientOverlay,
    endOpacity: slide.gradientOpacity ?? layout.gradientOverlay.endOpacity
  }
  drawGradientOverlay(ctx, overlayConfig)

  // 4. Desenha header (com cor ajustada ao fundo)
  drawHeader(ctx, template, headerTexts, layout.backgroundColor)

  // 5. Desenha headline (posição central/média)
  const headlineX = percentToPixel(layout.headlineArea.x, 'width')
  const headlineY = layoutPositions?.headlineY !== undefined
    ? percentToPixel(layoutPositions.headlineY, 'height')
    : percentToPixel(layout.headlineArea.y, 'height')
  const headlineWidth = percentToPixel(layout.headlineArea.width, 'width')

  ctx.fillStyle = layout.headlineColor

  // Verifica se deve usar fonte alternativa (bold condensed uppercase)
  const useAltFont = layout.useAltHeadline === true
  const baseSize = useAltFont ? typography.headlineAltSize : typography.headlineSize
  // Usa tamanho do layout se definido, depois do slide, senão usa do template
  const headlineSize = layoutPositions?.headlineFontSize ?? slide.headlineFontSize ?? baseSize

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
    // Fonte BOLD CONDENSED para fullImage
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
  // Usa alinhamento customizado do layout ou o padrão do template
  const headlineAlign = layoutPositions?.headlineAlign ?? layout.headlineArea.align
  ctx.textAlign = headlineAlign

  // Prepara o texto (UPPERCASE se usar fonte alternativa)
  const hasHtmlFormatting = slide.headline.includes('<')
  const headlineText = useAltFont ? htmlToPlainText(slide.headline).toUpperCase() : slide.headline

  // Calcula posição X baseada no alinhamento
  const headlineDrawX = headlineAlign === 'center'
    ? headlineX
    : headlineAlign === 'right'
      ? CANVAS_WIDTH - headlineX
      : headlineX

  // Se tem formatação HTML e não é fonte alternativa, usa renderRichText
  if (hasHtmlFormatting && !useAltFont) {
    const fontWeight = layoutPositions?.headlineFontWeight ?? 400
    const fontStyle = layoutPositions?.headlineFontStyle ?? typography.headlineStyle ?? 'normal'
    const fontFamily = layoutPositions?.headlineFontFamily ?? typography.headlineFont

    renderRichText(
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

      if (!useAltFont && decorations.underlineHeadline && slide.highlightWords?.length) {
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
  }

  // 6. Desenha body
  const bodyX = percentToPixel(layout.bodyArea.x, 'width')
  const bodyY = layoutPositions?.bodyY !== undefined
    ? percentToPixel(layoutPositions.bodyY, 'height')
    : percentToPixel(layout.bodyArea.y, 'height')
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
  // Usa alinhamento customizado do layout ou o padrão do template
  const bodyAlign = layoutPositions?.bodyAlign ?? layout.bodyArea.align
  ctx.textAlign = bodyAlign

  // Verifica se body tem formatação HTML
  const bodyHasHtml = slide.body.includes('<')

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
        lineHeight: 1.4
      },
      20
    )
  } else {
    // Renderização tradicional
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

  // 7.5 Seta decorativa hand-drawn (se aplicável)
  if (template.id === 'hand-drawn') {
    drawHandDrawnArrow(ctx, decorations.separatorColor)
  }

  // 8. Desenha footer (apenas slides 2+, com cor ajustada ao fundo)
  drawFooter(ctx, template, headerTexts, slide.slideNumber, layout.backgroundColor)
}
