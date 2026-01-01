import type { CarouselSlide } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts, SlideLayoutConfig } from '@/types/template'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/types/carousel'
import {
  drawHeader,
  drawImageCover,
  wrapText,
  drawTextWithUnderline,
  drawSeparatorLine,
  loadImage,
  percentToPixel,
  createFontString,
  createCondensedFontString,
  calculateDynamicFontSize
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

  // Busca posições customizadas para este layout específico
  const layoutPositions = slide.customPositions?.['imageTop']

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

  // 2.2 Header
  drawHeader(ctx, template, headerTexts)

  // 2.3 Imagem (assíncrono, mas posição já foi calculada)
  if (slide.imageUrl && layout.imageArea) {
    try {
      const img = await loadImage(slide.imageUrl)

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
      console.error('Failed to load image for imageTop layout:', error)
    }
  }

  // ========================================
  // PASSO 3: DESENHAR HEADLINE (posição já calculada acima)
  // ========================================

  ctx.fillStyle = layout.headlineColor

  // Verifica se deve usar fonte alternativa (bold condensed uppercase)
  const useAltFont = layout.useAltHeadline === true

  // Usa tamanho do slide se definido, senão calcula dinamicamente
  const baseHeadlineSize = useAltFont ? typography.headlineAltSize : typography.headlineSize
  const dynamicHeadlineSize = slide.headlineFontSize ?? calculateDynamicFontSize(
    totalTextLength,
    availableTextHeight,
    baseHeadlineSize - 8,  // min: 8px menor que base
    baseHeadlineSize + 20, // max: 20px maior que base (para textos curtos)
    baseHeadlineSize
  )

  if (useAltFont) {
    // Fonte BOLD CONDENSED para imageTop
    ctx.font = createCondensedFontString(
      dynamicHeadlineSize,
      typography.headlineAltFont,
      typography.headlineAltWeight
    )
  } else {
    // Fonte italic padrão
    ctx.font = createFontString(
      dynamicHeadlineSize,
      typography.headlineFont,
      typography.headlineWeight,
      typography.headlineStyle
    )
  }
  ctx.textAlign = layout.headlineArea.align

  // Prepara o texto (UPPERCASE se usar fonte alternativa)
  const headlineText = useAltFont ? slide.headline.toUpperCase() : slide.headline
  const headlineLines = wrapText(ctx, headlineText, headlineWidth, 20)
  const lineHeight = dynamicHeadlineSize * 1.15

  headlineLines.forEach((line, index) => {
    const x = layout.headlineArea.align === 'center'
      ? CANVAS_WIDTH / 2
      : layout.headlineArea.align === 'right'
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
  const headlineEndY = headlineY + (headlineLines.length * lineHeight)

  // 6. Desenha linha separadora (opcional)
  if (decorations.separatorLine) {
    const separatorY = headlineEndY + 15
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

  // Usa tamanho do slide se definido, senão calcula dinamicamente
  const remainingHeight = CANVAS_HEIGHT - bodyY - 40
  const dynamicBodySize = slide.bodyFontSize ?? calculateDynamicFontSize(
    slide.body?.length || 0,
    remainingHeight,
    typography.bodySize - 4,  // min
    typography.bodySize + 8,  // max (para textos curtos)
    typography.bodySize
  )

  ctx.fillStyle = layout.bodyColor
  ctx.font = `${typography.bodyWeight} ${dynamicBodySize}px ${typography.bodyFont}`
  ctx.textAlign = layout.bodyArea.align

  const bodyLines = wrapText(ctx, slide.body, bodyWidth, 20)
  const bodyLineHeight = dynamicBodySize * 1.5

  bodyLines.forEach((line, index) => {
    const x = layout.bodyArea.align === 'center'
      ? CANVAS_WIDTH / 2
      : layout.bodyArea.align === 'right'
        ? CANVAS_WIDTH - bodyX
        : bodyX

    ctx.fillText(line, x, bodyY + (index * bodyLineHeight))
  })
}
