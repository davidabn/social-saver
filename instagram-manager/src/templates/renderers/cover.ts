import type { CarouselSlide, ProfileBranding } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts, SlideLayoutConfig } from '@/types/template'
import { CANVAS_WIDTH, CANVAS_HEIGHT, getLayoutPositions } from '@/types/carousel'
import {
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

export async function renderCoverLayout(
  ctx: CanvasRenderingContext2D,
  slide: CarouselSlide,
  template: CarouselTemplate,
  layout: SlideLayoutConfig,
  headerTexts: HeaderTexts,
  profileBranding?: ProfileBranding
): Promise<void> {
  const { typography, decorations } = template
  const layoutPositions = getLayoutPositions(slide.customPositions, template.id, 'cover')

  // 1. Desenha cor de fundo
  ctx.fillStyle = layout.backgroundColor
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // 1.1 Desenha grain (textura granulada)
  if (slide.grainIntensity && slide.grainIntensity > 0) {
    drawGrain(ctx, slide.grainIntensity)
  }

  // 2. Desenha imagem de fundo (fullscreen) ou tamanho original (hand-drawn)
  if (slide.imageUrl && layout.imageArea) {
    try {
      const img = await loadImage(slide.imageUrl)

      if (template.id === 'hand-drawn') {
        // Hand-drawn: imagem no tamanho original, centralizada na área superior
        const imgY = layoutPositions?.imageY !== undefined
          ? percentToPixel(layoutPositions.imageY, 'height')
          : percentToPixel(layout.imageArea.y || 10, 'height')
        const imgMaxHeight = percentToPixel(layout.imageArea.height || 40, 'height')
        drawImageOriginalSize(
          ctx, img, 20, imgY, CANVAS_WIDTH - 40, imgMaxHeight,
          layoutPositions?.imageOffsetX ?? 0,
          layoutPositions?.imageOffsetY ?? 0
        )
      } else {
        // Outros templates: imagem fullscreen
        drawImageCover(
          ctx, img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT,
          layoutPositions?.imageScale ?? 1.0,
          layoutPositions?.imageOffsetX ?? 0,
          layoutPositions?.imageOffsetY ?? 0
        )
      }
    } catch (error) {
      console.error('Failed to load image for cover layout:', error)
      // Se falhar ao carregar, desenha placeholder
      if (template.id === 'hand-drawn') {
        const imgY = layoutPositions?.imageY !== undefined
          ? percentToPixel(layoutPositions.imageY, 'height')
          : percentToPixel(layout.imageArea.y || 10, 'height')
        const imgMaxHeight = percentToPixel(layout.imageArea.height || 40, 'height')
        drawImagePlaceholder(ctx, 20, imgY, CANVAS_WIDTH - 40, imgMaxHeight, 20)
      } else {
        drawImagePlaceholder(ctx, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0)
      }
    }
  } else if (layout.imageArea) {
    // Sem imagem definida - desenha placeholder visual
    if (template.id === 'hand-drawn') {
      const imgY = layoutPositions?.imageY !== undefined
        ? percentToPixel(layoutPositions.imageY, 'height')
        : percentToPixel(layout.imageArea.y || 10, 'height')
      const imgMaxHeight = percentToPixel(layout.imageArea.height || 40, 'height')
      drawImagePlaceholder(ctx, 20, imgY, CANVAS_WIDTH - 40, imgMaxHeight, 20)
    } else {
      drawImagePlaceholder(ctx, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0)
    }
  }

  // 3. Desenha gradient overlay (usa opacidade do slide se definida)
  // Não aplica gradient no hand-drawn pois a imagem não é fullscreen
  if (template.id !== 'hand-drawn') {
    const overlayConfig = {
      ...layout.gradientOverlay,
      endOpacity: slide.gradientOpacity ?? layout.gradientOverlay.endOpacity
    }
    drawGradientOverlay(ctx, overlayConfig)
  }

  // 4. Desenha header (com cor ajustada ao fundo)
  drawHeader(ctx, template, headerTexts, layout.backgroundColor)

  // 4.5. Desenha branding card centralizado (apenas no slide 1)
  if (slide.slideNumber === 1 && profileBranding && (profileBranding.displayName || profileBranding.username)) {
    // Posição Y: usa customizada ou calcula acima do headline
    const baseHeadlineY = layoutPositions?.headlineY !== undefined
      ? layoutPositions.headlineY
      : layout.headlineArea.y
    const defaultBrandingY = baseHeadlineY - 8  // 8% acima do headline
    const brandingY = percentToPixel(layoutPositions?.brandingY ?? defaultBrandingY, 'height')
    const brandingScale = layoutPositions?.brandingScale ?? 1.0

    // X é ignorado pois o branding agora é auto-centralizado
    await drawProfileBranding(
      ctx,
      profileBranding,
      0,  // x ignorado (auto-centralizado)
      brandingY,
      layout.headlineColor,
      CANVAS_WIDTH,  // passa largura do canvas para centralizar
      brandingScale
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
  // Usa fonte customizada do layout se definida, senão usa do template
  if (layoutPositions?.headlineFontFamily) {
    ctx.font = createCustomFontString(
      headlineSize,
      layoutPositions.headlineFontFamily,
      typography.headlineFont,
      layoutPositions.headlineFontWeight ?? 400,
      layoutPositions.headlineFontStyle ?? 'normal'
    )
  } else {
    ctx.font = createFontString(
      headlineSize,
      typography.headlineFont,
      typography.headlineWeight,
      typography.headlineStyle  // ITALIC
    )
  }
  // Usa alinhamento customizado do layout ou o padrão do template
  const headlineAlign = layoutPositions?.headlineAlign ?? layout.headlineArea.align
  ctx.textAlign = headlineAlign

  // Verifica se tem formatação HTML
  const hasHtmlFormatting = slide.headline.includes('<')

  // Calcula posição X baseada no alinhamento
  const headlineDrawX = headlineAlign === 'center'
    ? headlineX
    : headlineAlign === 'right'
      ? CANVAS_WIDTH - headlineX
      : headlineX

  const lineHeight = headlineSize * 1.15
  let headlineEndY: number

  // Se tem formatação HTML, usa renderRichText
  if (hasHtmlFormatting) {
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
    const headlineLines = wrapText(ctx, slide.headline, headlineWidth, 20)

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
    headlineEndY = headlineY + (headlineLines.length * lineHeight)
  }

  // 6. Desenha body - posição customizada ou dinâmica
  const bodyX = percentToPixel(layout.bodyArea.x, 'width')
  const bodyY = layoutPositions?.bodyY !== undefined
    ? percentToPixel(layoutPositions.bodyY, 'height')
    : headlineEndY + 30  // 30px de margem após headline
  const bodyWidth = percentToPixel(layout.bodyArea.width, 'width')

  // Usa tamanho do layout se definido, depois do slide, senão usa do template
  const bodySize = layoutPositions?.bodyFontSize ?? slide.bodyFontSize ?? typography.bodySize

  ctx.fillStyle = layout.bodyColor
  // Usa fonte customizada do layout se definida, senão usa do template
  if (layoutPositions?.bodyFontFamily) {
    ctx.font = createCustomFontString(
      bodySize,
      layoutPositions.bodyFontFamily,
      typography.bodyFont,
      layoutPositions.bodyFontWeight ?? 400,
      layoutPositions.bodyFontStyle ?? 'normal'
    )
  } else {
    ctx.font = `${typography.bodyWeight} ${bodySize}px ${typography.bodyFont}`
  }
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

  // 6.5 Seta decorativa hand-drawn (se aplicável)
  if (template.id === 'hand-drawn') {
    drawHandDrawnArrow(ctx, template.decorations.separatorColor)
  }

  // 7. Desenha footer (apenas slides 2+, com cor ajustada ao fundo)
  drawFooter(ctx, template, headerTexts, slide.slideNumber, layout.backgroundColor)
}