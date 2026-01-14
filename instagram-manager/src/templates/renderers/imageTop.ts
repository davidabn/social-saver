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
  drawSeparatorLine,
  drawDoubleSeparatorLines,
  drawHandDrawnArrow,
  loadImage,
  percentToPixel,
  createCondensedFontString,
  createCustomFontString,
  calculateDynamicFontSize,
  renderRichText,
  htmlToPlainText
} from './base'

export async function renderImageTopLayout(
  ctx: CanvasRenderingContext2D,
  slide: CarouselSlide,
  template: CarouselTemplate,
  layout: SlideLayoutConfig,
  headerTexts: HeaderTexts
): Promise<void> {
  const { typography, decorations, header } = template

  // ========================================
  // PASSO 1: CALCULAR TODAS AS POSIÇÕES PRIMEIRO (síncrono)
  // ========================================
  const headerOffset = header.enabled ? header.height : 0

  // Busca posições customizadas para este layout específico (chave composta template:layout)
  const layoutPositions = getLayoutPositions(slide.customPositions, template.id, 'imageTop')

  // Área da imagem (usa posição customizada se definida)
  const imgY = layoutPositions?.imageY !== undefined
    ? percentToPixel(layoutPositions.imageY, 'height')
    : percentToPixel(layout.imageArea?.y || 4, 'height') + headerOffset
  const imgHeight = layoutPositions?.imageHeight !== undefined
    ? percentToPixel(layoutPositions.imageHeight, 'height')
    : percentToPixel(layout.imageArea?.height || 55, 'height')
  const imgEndY = imgY + imgHeight  // Onde a imagem TERMINA

  // Headline - usa posição customizada ou calcula baseado na imagem
  const headlineX = percentToPixel(layout.headlineArea.x, 'width')
  const headlineY = layoutPositions?.headlineY !== undefined
    ? percentToPixel(layoutPositions.headlineY, 'height')
    : imgEndY + 100  // 100px após fim da imagem
  const headlineWidth = percentToPixel(layout.headlineArea.width, 'width')

  // Calcular espaço disponível para texto (área abaixo da imagem)
  const availableTextHeight = CANVAS_HEIGHT - headlineY - 40  // 40px margem inferior
  const totalTextLength = (slide.headline?.length || 0) + (slide.body?.length || 0)

  // Margem para a imagem
  const imgMargin = 20
  const imgRadius = 20

  // ========================================
  // PASSO 2: DESENHAR ELEMENTOS
  // ========================================

  // 2.1 Cor de fundo
  ctx.fillStyle = layout.backgroundColor
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // 2.1.1 Desenha grain (textura granulada)
  if (slide.grainIntensity && slide.grainIntensity > 0) {
    drawGrain(ctx, slide.grainIntensity)
  }

  // 2.2 Header (com cor ajustada ao fundo)
  drawHeader(ctx, template, headerTexts, layout.backgroundColor)

  // 2.3 Imagem (assíncrono, mas posição já foi calculada)
  if (slide.imageUrl && layout.imageArea) {
    try {
      const img = await loadImage(slide.imageUrl)

      if (template.id === 'hand-drawn') {
        // Hand-drawn: imagem no tamanho original, centralizada, sem bordas arredondadas
        drawImageOriginalSize(
          ctx, img,
          imgMargin,
          imgY,
          CANVAS_WIDTH - imgMargin * 2,
          imgHeight,  // altura máxima
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
      console.error('Failed to load image for imageTop layout:', error)
      // Se falhar ao carregar, desenha placeholder
      drawImagePlaceholder(ctx, imgMargin, imgY, CANVAS_WIDTH - imgMargin * 2, imgHeight, imgRadius)
    }
  } else if (layout.imageArea) {
    // Sem imagem definida - desenha placeholder visual
    drawImagePlaceholder(ctx, imgMargin, imgY, CANVAS_WIDTH - imgMargin * 2, imgHeight, imgRadius)
  }

  // ========================================
  // PASSO 3: DESENHAR DECORAÇÕES HAND-DRAWN (se aplicável)
  // ========================================

  // Linhas separadoras duplas para template hand-drawn (acima do headline)
  if (template.id === 'hand-drawn') {
    const separatorY = headlineY - 40  // 40px acima do headline
    drawDoubleSeparatorLines(ctx, separatorY, decorations.separatorColor, 120, 2, 8)
  }

  // ========================================
  // PASSO 4: DESENHAR HEADLINE (posição já calculada acima)
  // ========================================

  ctx.fillStyle = layout.headlineColor

  // Verifica se deve usar fonte alternativa (bold condensed uppercase)
  const useAltFont = layout.useAltHeadline === true

  // Usa tamanho do layout se definido, depois do slide, senão calcula dinamicamente
  const baseHeadlineSize = useAltFont ? typography.headlineAltSize : typography.headlineSize
  const dynamicHeadlineSize = layoutPositions?.headlineFontSize ?? slide.headlineFontSize ?? calculateDynamicFontSize(
    totalTextLength,
    availableTextHeight,
    baseHeadlineSize - 8,  // min: 8px menor que base
    baseHeadlineSize + 20, // max: 20px maior que base (para textos curtos)
    baseHeadlineSize
  )

  // Usa fonte customizada se definida, senão usa fonte do template
  if (layoutPositions?.headlineFontFamily) {
    ctx.font = createCustomFontString(
      dynamicHeadlineSize,
      layoutPositions.headlineFontFamily,
      useAltFont ? typography.headlineAltFont : typography.headlineFont,
      layoutPositions.headlineFontWeight ?? (useAltFont ? 700 : 400),
      layoutPositions.headlineFontStyle ?? 'normal'
    )
  } else if (useAltFont) {
    // Fonte BOLD CONDENSED para imageTop
    ctx.font = createCondensedFontString(
      dynamicHeadlineSize,
      typography.headlineAltFont,
      typography.headlineAltWeight
    )
  } else {
    // Fonte italic padrão - usa createCustomFontString para garantir resolução correta
    ctx.font = createCustomFontString(
      dynamicHeadlineSize,
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

  const lineHeight = dynamicHeadlineSize * 1.15
  let headlineEndY: number

  // Se tem formatação HTML, usa renderRichText (suporta uppercase para fonte alternativa)
  if (hasHtmlFormatting) {
    // Usa fonte alternativa se configurado, senão usa fonte customizada ou padrão
    const fontWeight = useAltFont
      ? typography.headlineAltWeight
      : (layoutPositions?.headlineFontWeight ?? 400)
    const fontStyle = layoutPositions?.headlineFontStyle ?? typography.headlineStyle ?? 'normal'
    const fontFamily = useAltFont
      ? typography.headlineAltFont
      : (layoutPositions?.headlineFontFamily ?? typography.headlineFont)

    const renderedHeight = renderRichText(
      ctx,
      slide.headline,
      headlineDrawX,
      headlineY,
      headlineWidth,
      {
        fontSize: dynamicHeadlineSize,
        fontFamily,
        fontWeight,
        fontStyle,
        color: layout.headlineColor,
        textAlign: headlineAlign,
        lineHeight: 1.15,
        uppercase: useAltFont  // UPPERCASE quando usa fonte alternativa
      },
      20
    )
    headlineEndY = headlineY + renderedHeight
  } else {
    // Renderização tradicional (sem HTML)
    const headlineLines = wrapText(ctx, headlineText, headlineWidth, 20)

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

    // 5. Calcula onde o headline termina
    headlineEndY = headlineY + (headlineLines.length * lineHeight)
  }

  // 6. Desenha linha separadora (opcional)
  if (decorations.separatorLine) {
    const separatorY = layoutPositions?.separatorY !== undefined
      ? percentToPixel(layoutPositions.separatorY, 'height')
      : headlineEndY + 15
    drawSeparatorLine(
      ctx,
      separatorY,
      decorations.separatorColor,
      decorations.separatorThickness,
      headlineX,
      headlineX + 100
    )
  }

  // 7. Desenha body - posição customizada ou abaixo do headline
  const bodyX = percentToPixel(layout.bodyArea.x, 'width')
  const bodyY = layoutPositions?.bodyY !== undefined
    ? percentToPixel(layoutPositions.bodyY, 'height')
    : headlineEndY + (decorations.separatorLine ? 60 : 50)  // Margem generosa após headline
  const bodyWidth = percentToPixel(layout.bodyArea.width, 'width')

  // Usa tamanho do layout se definido, depois do slide, senão calcula dinamicamente
  const remainingHeight = CANVAS_HEIGHT - bodyY - 40
  const dynamicBodySize = layoutPositions?.bodyFontSize ?? slide.bodyFontSize ?? calculateDynamicFontSize(
    slide.body?.length || 0,
    remainingHeight,
    typography.bodySize - 4,  // min
    typography.bodySize + 8,  // max (para textos curtos)
    typography.bodySize
  )

  ctx.fillStyle = layout.bodyColor
  // Usa createCustomFontString para garantir resolução correta e fallback
  ctx.font = createCustomFontString(
    dynamicBodySize,
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
        fontSize: dynamicBodySize,
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
    const bodyLineHeight = dynamicBodySize * 1.5

    bodyLines.forEach((line, index) => {
      const x = bodyAlign === 'center'
        ? CANVAS_WIDTH / 2
        : bodyAlign === 'right'
          ? CANVAS_WIDTH - bodyX
          : bodyX

      ctx.fillText(line, x, bodyY + (index * bodyLineHeight))
    })
  }

  // 8. Seta decorativa hand-drawn (se aplicável)
  if (template.id === 'hand-drawn') {
    drawHandDrawnArrow(ctx, decorations.separatorColor)
  }

  // 9. Desenha footer (apenas slides 2+, com cor ajustada ao fundo)
  drawFooter(ctx, template, headerTexts, slide.slideNumber, layout.backgroundColor)
}
