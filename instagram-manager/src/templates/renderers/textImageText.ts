import type { CarouselSlide } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts, SlideLayoutConfig } from '@/types/template'
import { CANVAS_WIDTH, CANVAS_HEIGHT, getLayoutPositions } from '@/types/carousel'
import {
  drawHeader,
  drawFooter,
  drawGrain,
  drawImageCover,
  drawImageOriginalSize,
  drawImagePlaceholder,
  wrapText,
  drawTextWithUnderline,
  drawDoubleSeparatorLines,
  drawHandDrawnArrow,
  loadImage,
  percentToPixel,
  createFontString,
  createCustomFontString,
  renderRichText
} from './base'

export async function renderTextImageTextLayout(
  ctx: CanvasRenderingContext2D,
  slide: CarouselSlide,
  template: CarouselTemplate,
  layout: SlideLayoutConfig,
  headerTexts: HeaderTexts
): Promise<void> {
  const { typography, decorations, header } = template
  // Chave composta template:layout para isolamento entre templates
  const layoutPositions = getLayoutPositions(slide.customPositions, template.id, 'textImageText')

  // 1. Desenha cor de fundo
  ctx.fillStyle = layout.backgroundColor
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // 1.1 Desenha grain (textura granulada)
  if (slide.grainIntensity && slide.grainIntensity > 0) {
    drawGrain(ctx, slide.grainIntensity)
  }

  // 2. Desenha header (com cor ajustada ao fundo)
  drawHeader(ctx, template, headerTexts, layout.backgroundColor)

  // 3. Calcula offset do header
  const headerOffset = header.enabled ? header.height : 0

  // 4. Desenha headline no topo
  const headlineX = percentToPixel(layout.headlineArea.x, 'width')
  const headlineY = layoutPositions?.headlineY !== undefined
    ? percentToPixel(layoutPositions.headlineY, 'height')
    : percentToPixel(layout.headlineArea.y, 'height') + headerOffset
  const headlineWidth = percentToPixel(layout.headlineArea.width, 'width')

  // Usa tamanho do layout se definido, depois do slide, senão usa do template
  const headlineSize = layoutPositions?.headlineFontSize ?? slide.headlineFontSize ?? typography.headlineSize

  ctx.fillStyle = layout.headlineColor
  // Usa fonte customizada se definida, senão usa fonte do template
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
      typography.headlineStyle
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

  // Se tem formatação HTML, usa renderRichText
  if (hasHtmlFormatting) {
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
  }

  // 4.5 Linhas separadoras duplas para template hand-drawn (após headline, antes da imagem)
  if (template.id === 'hand-drawn') {
    const separatorY = headlineY + lineHeight + 20  // 20px após headline
    drawDoubleSeparatorLines(ctx, separatorY, decorations.separatorColor, 120, 2, 8)
  }

  // 5. Desenha imagem no meio (com bordas arredondadas)
  const imgMargin = 20
  const imgRadius = 20
  const imgY = layoutPositions?.imageY !== undefined
    ? percentToPixel(layoutPositions.imageY, 'height')
    : percentToPixel(layout.imageArea?.y || 30, 'height')
  const imgHeight = layoutPositions?.imageHeight !== undefined
    ? percentToPixel(layoutPositions.imageHeight, 'height')
    : percentToPixel(layout.imageArea?.height || 40, 'height')

  if (slide.imageUrl && layout.imageArea) {
    try {
      const img = await loadImage(slide.imageUrl)

      if (template.id === 'hand-drawn') {
        // Hand-drawn: imagem no tamanho original, centralizada
        drawImageOriginalSize(
          ctx, img, imgMargin, imgY, CANVAS_WIDTH - imgMargin * 2, imgHeight,
          layoutPositions?.imageOffsetX ?? 0,
          layoutPositions?.imageOffsetY ?? 0
        )
      } else {
        // Outros templates: bordas arredondadas e imagem cover
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
      }
    } catch (error) {
      console.error('Failed to load image for textImageText layout:', error)
      // Se falhar ao carregar, desenha placeholder
      drawImagePlaceholder(ctx, imgMargin, imgY, CANVAS_WIDTH - imgMargin * 2, imgHeight, imgRadius)
    }
  } else if (layout.imageArea) {
    // Sem imagem definida - desenha placeholder visual
    drawImagePlaceholder(ctx, imgMargin, imgY, CANVAS_WIDTH - imgMargin * 2, imgHeight, imgRadius)
  }

  // 6. Desenha body embaixo da imagem
  const bodyX = percentToPixel(layout.bodyArea.x, 'width')
  const bodyY = layoutPositions?.bodyY !== undefined
    ? percentToPixel(layoutPositions.bodyY, 'height')
    : percentToPixel(layout.bodyArea.y, 'height')
  const bodyWidth = percentToPixel(layout.bodyArea.width, 'width')

  // Usa tamanho do layout se definido, depois do slide, senão usa do template
  const bodySize = layoutPositions?.bodyFontSize ?? slide.bodyFontSize ?? typography.bodySize

  ctx.fillStyle = layout.bodyColor
  // Usa fonte customizada se definida, senão usa fonte do template
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

  // 6.5 Seta decorativa hand-drawn (se aplicável)
  if (template.id === 'hand-drawn') {
    drawHandDrawnArrow(ctx, decorations.separatorColor)
  }

  // 7. Desenha footer (apenas slides 2+, com cor ajustada ao fundo)
  drawFooter(ctx, template, headerTexts, slide.slideNumber, layout.backgroundColor)
}
