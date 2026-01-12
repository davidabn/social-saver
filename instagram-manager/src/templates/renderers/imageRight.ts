import type { CarouselSlide } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts, SlideLayoutConfig } from '@/types/template'
import { CANVAS_HEIGHT, getLayoutPositions } from '@/types/carousel'
import {
  drawHeader,
  drawFooter,
  drawGrain,
  drawImageCover,
  drawImagePlaceholder,
  wrapText,
  drawTextWithUnderline,
  drawSeparatorLine,
  loadImage,
  percentToPixel,
  createFontString,
  createCustomFontString,
  renderRichText
} from './base'

export async function renderImageRightLayout(
  ctx: CanvasRenderingContext2D,
  slide: CarouselSlide,
  template: CarouselTemplate,
  layout: SlideLayoutConfig,
  headerTexts: HeaderTexts
): Promise<void> {
  const { typography, decorations, header } = template
  const layoutPositions = getLayoutPositions(slide.customPositions, template.id, 'imageRight')

  // Calcular dimensões das áreas
  const textAreaWidth = percentToPixel(100 - (layout.imageArea?.width || 40), 'width')  // 60%

  // 1. Desenha fundo escuro apenas na área de texto (lado esquerdo)
  ctx.fillStyle = layout.backgroundColor
  ctx.fillRect(0, 0, textAreaWidth, CANVAS_HEIGHT)

  // 1.1 Desenha grain (textura granulada) - apenas na área de texto
  if (slide.grainIntensity && slide.grainIntensity > 0) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, textAreaWidth, CANVAS_HEIGHT)
    ctx.clip()
    drawGrain(ctx, slide.grainIntensity)
    ctx.restore()
  }

  // 2. Desenha imagem no lado direito (40%)
  const imgX = percentToPixel(layout.imageArea?.x || 60, 'width')
  const imgY = percentToPixel(layout.imageArea?.y || 0, 'height')
  const imgWidth = percentToPixel(layout.imageArea?.width || 40, 'width')
  const imgHeight = percentToPixel(layout.imageArea?.height || 100, 'height')

  if (slide.imageUrl && layout.imageArea) {
    try {
      const img = await loadImage(slide.imageUrl)

      drawImageCover(
        ctx, img, imgX, imgY, imgWidth, imgHeight,
        layoutPositions?.imageScale ?? 1.0,
        layoutPositions?.imageOffsetX ?? 0,
        layoutPositions?.imageOffsetY ?? 0
      )
    } catch (error) {
      console.error('Failed to load image for imageRight layout:', error)
      // Se falhar ao carregar, desenha placeholder
      drawImagePlaceholder(ctx, imgX, imgY, imgWidth, imgHeight, 0)
    }
  } else if (layout.imageArea) {
    // Sem imagem definida - desenha placeholder visual (sem bordas arredondadas para layout lateral)
    drawImagePlaceholder(ctx, imgX, imgY, imgWidth, imgHeight, 0)
  }

  // 3. Desenha header (com cor ajustada ao fundo)
  drawHeader(ctx, template, headerTexts, layout.backgroundColor)

  // 4. Desenha headline no lado esquerdo (topo)
  const headlineX = percentToPixel(layout.headlineArea.x, 'width')
  const headlineY = layoutPositions?.headlineY !== undefined
    ? percentToPixel(layoutPositions.headlineY, 'height')
    : percentToPixel(layout.headlineArea.y, 'height') + (header.enabled ? header.height : 0)
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
  const headlineAlign = layoutPositions?.headlineAlign ?? layout.headlineArea.align
  ctx.textAlign = headlineAlign

  // Verifica se tem formatação HTML
  const hasHtmlFormatting = slide.headline.includes('<')

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
      headlineX,
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
        ? textAreaWidth / 2
        : headlineAlign === 'right'
          ? textAreaWidth - headlineX
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

  // 5. Desenha body no lado esquerdo (abaixo headline)
  const bodyX = percentToPixel(layout.bodyArea.x, 'width')
  const bodyY = layoutPositions?.bodyY !== undefined
    ? percentToPixel(layoutPositions.bodyY, 'height')
    : headlineEndY + 30
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
  const bodyAlign = layoutPositions?.bodyAlign ?? layout.bodyArea.align
  ctx.textAlign = bodyAlign

  // Verifica se body tem formatação HTML
  const bodyHasHtml = slide.body.includes('<')

  const bodyLineHeight = bodySize * 1.4
  let bodyEndY: number

  if (bodyHasHtml) {
    const bodyFontWeight = layoutPositions?.bodyFontWeight ?? 400
    const bodyFontStyle = layoutPositions?.bodyFontStyle ?? 'normal'
    const bodyFontFamily = layoutPositions?.bodyFontFamily ?? typography.bodyFont

    const renderedHeight = renderRichText(
      ctx,
      slide.body,
      bodyX,
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
    bodyEndY = bodyY + renderedHeight
  } else {
    // Renderização tradicional
    const bodyLines = wrapText(ctx, slide.body, bodyWidth, 20)

    bodyLines.forEach((line, index) => {
      const x = bodyAlign === 'center'
        ? textAreaWidth / 2
        : bodyAlign === 'right'
          ? textAreaWidth - bodyX
          : bodyX

      ctx.fillText(line, x, bodyY + (index * bodyLineHeight))
    })
    bodyEndY = bodyY + (bodyLines.length * bodyLineHeight)
  }

  // 6. Desenha linha separadora (opcional) - abaixo do body
  if (decorations.separatorLine) {
    const separatorY = layoutPositions?.separatorY !== undefined
      ? percentToPixel(layoutPositions.separatorY, 'height')
      : bodyEndY + 30
    drawSeparatorLine(
      ctx,
      separatorY,
      decorations.separatorColor,
      decorations.separatorThickness,
      headlineX,
      headlineX + 100
    )
  }

  // 7. Desenha footer (apenas slides 2+, com cor ajustada ao fundo)
  drawFooter(ctx, template, headerTexts, slide.slideNumber, layout.backgroundColor)
}
