import { writePsd, Psd, Layer } from 'ag-psd'
import type { CarouselSlide, ProfileBranding } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts, SlideLayoutConfig } from '@/types/template'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/types/carousel'
import {
  loadImage,
  drawImageCover,
  drawGradientOverlay,
  hexToRgba,
  wrapText,
  percentToPixel,
  createFontString,
  MOCKUP_IMAGE_URL
} from '@/templates/renderers/base'

// Create a solid color background layer
function createBackgroundLayer(color: string): Layer {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = color
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  return {
    name: 'Background',
    canvas,
    left: 0,
    top: 0,
    blendMode: 'normal'
  }
}

// Create image layer
async function createImageLayer(
  imageUrl: string,
  scale: number = 1.0,
  offsetX: number = 0,
  offsetY: number = 0
): Promise<Layer> {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')!

  try {
    const img = await loadImage(imageUrl)
    drawImageCover(ctx, img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, scale, offsetX, offsetY)
  } catch (error) {
    console.error('Failed to load image for PSD:', error)
    // Leave canvas transparent if image fails
  }

  return {
    name: 'Image',
    canvas,
    left: 0,
    top: 0,
    blendMode: 'normal'
  }
}

// Create gradient overlay layer
function createGradientLayer(
  config: { enabled: boolean; direction: string; startOpacity: number; endOpacity: number; color: string }
): Layer {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')!

  if (config.enabled) {
    drawGradientOverlay(ctx, config as any)
  }

  return {
    name: 'Gradient Overlay',
    canvas,
    left: 0,
    top: 0,
    blendMode: 'normal'
  }
}

// Create header group with 3 text layers
function createHeaderGroup(
  template: CarouselTemplate,
  headerTexts: HeaderTexts
): Layer {
  if (!template.header.enabled) {
    return { name: 'Header', children: [] }
  }

  const { height, textColor } = template.header
  const { headerFont, headerSize } = template.typography
  const padding = 30
  const yPos = height / 2 + 5

  // Create canvas for each header text
  const createHeaderTextCanvas = (text: string, align: 'left' | 'center' | 'right'): HTMLCanvasElement => {
    const canvas = document.createElement('canvas')
    canvas.width = CANVAS_WIDTH
    canvas.height = height + 20
    const ctx = canvas.getContext('2d')!

    ctx.font = `${headerSize}px ${headerFont}`
    ctx.fillStyle = textColor
    ctx.textBaseline = 'middle'
    ctx.textAlign = align

    let x = padding
    if (align === 'center') x = CANVAS_WIDTH / 2
    if (align === 'right') x = CANVAS_WIDTH - padding

    ctx.fillText(text.toUpperCase(), x, yPos)
    return canvas
  }

  return {
    name: 'Header',
    children: [
      {
        name: 'Header Left',
        canvas: createHeaderTextCanvas(headerTexts.left, 'left'),
        left: 0,
        top: 0
      },
      {
        name: 'Header Center',
        canvas: createHeaderTextCanvas(headerTexts.center, 'center'),
        left: 0,
        top: 0
      },
      {
        name: 'Header Right',
        canvas: createHeaderTextCanvas(headerTexts.right, 'right'),
        left: 0,
        top: 0
      }
    ]
  }
}

// Create branding group (avatar + name + username + verified)
async function createBrandingGroup(
  branding: ProfileBranding,
  x: number,
  y: number,
  textColor: string
): Promise<Layer> {
  const avatarSize = 56
  const textX = x + avatarSize + 16

  const children: Layer[] = []

  // Avatar layer
  if (branding.avatarUrl) {
    try {
      const avatarCanvas = document.createElement('canvas')
      avatarCanvas.width = avatarSize
      avatarCanvas.height = avatarSize
      const ctx = avatarCanvas.getContext('2d')!

      const avatarImg = await loadImage(branding.avatarUrl)
      const imgWidth = avatarImg.naturalWidth || avatarImg.width
      const imgHeight = avatarImg.naturalHeight || avatarImg.height
      const minDim = Math.min(imgWidth, imgHeight)
      const sx = (imgWidth - minDim) / 2
      const sy = (imgHeight - minDim) / 2

      // Create circular clip
      ctx.beginPath()
      ctx.arc(avatarSize / 2, avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()

      ctx.drawImage(avatarImg, sx, sy, minDim, minDim, 0, 0, avatarSize, avatarSize)

      children.push({
        name: 'Avatar',
        canvas: avatarCanvas,
        left: Math.round(x),
        top: Math.round(y)
      })
    } catch (e) {
      console.error('Failed to load avatar for PSD:', e)
    }
  }

  // Display name layer
  const nameCanvas = document.createElement('canvas')
  nameCanvas.width = 300
  nameCanvas.height = 40
  const nameCtx = nameCanvas.getContext('2d')!
  nameCtx.fillStyle = textColor
  nameCtx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  nameCtx.textBaseline = 'middle'
  nameCtx.fillText(branding.displayName || 'Seu Nome', 0, 20)

  children.push({
    name: 'Display Name',
    canvas: nameCanvas,
    left: Math.round(textX),
    top: Math.round(y + 10)
  })

  // Username layer
  const usernameCanvas = document.createElement('canvas')
  usernameCanvas.width = 200
  usernameCanvas.height = 30
  const usernameCtx = usernameCanvas.getContext('2d')!
  usernameCtx.fillStyle = hexToRgba(textColor, 0.7)
  usernameCtx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  usernameCtx.textBaseline = 'middle'
  usernameCtx.fillText(`@${branding.username || 'username'}`, 0, 15)

  children.push({
    name: 'Username',
    canvas: usernameCanvas,
    left: Math.round(textX),
    top: Math.round(y + 36)
  })

  // Verified badge
  if (branding.isVerified) {
    const badgeCanvas = document.createElement('canvas')
    badgeCanvas.width = 24
    badgeCanvas.height = 24
    const badgeCtx = badgeCanvas.getContext('2d')!

    // Blue circle
    badgeCtx.fillStyle = '#1DA1F2'
    badgeCtx.beginPath()
    badgeCtx.arc(12, 12, 10, 0, Math.PI * 2)
    badgeCtx.fill()

    // White checkmark
    badgeCtx.strokeStyle = '#FFFFFF'
    badgeCtx.lineWidth = 2
    badgeCtx.lineCap = 'round'
    badgeCtx.lineJoin = 'round'
    badgeCtx.beginPath()
    badgeCtx.moveTo(8, 12)
    badgeCtx.lineTo(11, 15)
    badgeCtx.lineTo(17, 9)
    badgeCtx.stroke()

    const nameWidth = nameCtx.measureText(branding.displayName || 'Seu Nome').width

    children.push({
      name: 'Verified Badge',
      canvas: badgeCanvas,
      left: Math.round(textX + nameWidth + 8),
      top: Math.round(y + 8)
    })
  }

  return {
    name: 'Profile Branding',
    children
  }
}

// Create headline text layer
function createHeadlineLayer(
  slide: CarouselSlide,
  layout: SlideLayoutConfig,
  template: CarouselTemplate,
  customY?: number
): Layer {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')!

  const headlineX = percentToPixel(layout.headlineArea.x, 'width')
  const headlineY = customY !== undefined
    ? percentToPixel(customY, 'height')
    : percentToPixel(layout.headlineArea.y, 'height')
  const headlineWidth = percentToPixel(layout.headlineArea.width, 'width')

  const headlineSize = slide.headlineFontSize ?? template.typography.headlineSize

  ctx.fillStyle = layout.headlineColor
  ctx.font = createFontString(
    headlineSize,
    template.typography.headlineFont,
    template.typography.headlineWeight,
    template.typography.headlineStyle
  )
  ctx.textAlign = layout.headlineArea.align

  const headlineLines = wrapText(ctx, slide.headline, headlineWidth, 20)
  const lineHeight = headlineSize * 1.15

  headlineLines.forEach((line, index) => {
    let x = headlineX
    if (layout.headlineArea.align === 'center') x = CANVAS_WIDTH / 2
    if (layout.headlineArea.align === 'right') x = CANVAS_WIDTH - headlineX

    ctx.fillText(line, x, headlineY + (index * lineHeight))
  })

  return {
    name: 'Headline',
    canvas,
    left: 0,
    top: 0,
    blendMode: 'normal'
  }
}

// Create body text layer
function createBodyLayer(
  slide: CarouselSlide,
  layout: SlideLayoutConfig,
  template: CarouselTemplate,
  headlineEndY: number,
  customY?: number
): Layer {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')!

  const bodyX = percentToPixel(layout.bodyArea.x, 'width')
  const bodyY = customY !== undefined
    ? percentToPixel(customY, 'height')
    : headlineEndY + 30
  const bodyWidth = percentToPixel(layout.bodyArea.width, 'width')

  const bodySize = slide.bodyFontSize ?? template.typography.bodySize

  ctx.fillStyle = layout.bodyColor
  ctx.font = `${template.typography.bodyWeight} ${bodySize}px ${template.typography.bodyFont}`
  ctx.textAlign = layout.bodyArea.align

  const bodyLines = wrapText(ctx, slide.body, bodyWidth, 20)
  const bodyLineHeight = bodySize * 1.4

  bodyLines.forEach((line, index) => {
    let x = bodyX
    if (layout.bodyArea.align === 'center') x = CANVAS_WIDTH / 2
    if (layout.bodyArea.align === 'right') x = CANVAS_WIDTH - bodyX

    ctx.fillText(line, x, bodyY + (index * bodyLineHeight))
  })

  return {
    name: 'Body',
    canvas,
    left: 0,
    top: 0,
    blendMode: 'normal'
  }
}

// Main export function - creates PSD for a single slide
export async function createPsdFromSlide(
  slide: CarouselSlide,
  template: CarouselTemplate,
  headerTexts: HeaderTexts,
  profileBranding?: ProfileBranding
): Promise<ArrayBuffer> {
  const layoutType = slide.layoutType || 'cover'
  const layout = template.layouts[layoutType]
  const layoutPositions = slide.customPositions?.[layoutType]

  const layers: Layer[] = []

  // 1. Background layer
  layers.push(createBackgroundLayer(layout.backgroundColor))

  // 2. Image layer (if has image area)
  const imageToUse = slide.imageUrl || (slide.showMockup !== false ? MOCKUP_IMAGE_URL : null)
  if (imageToUse && layout.imageArea) {
    const imageLayer = await createImageLayer(
      imageToUse,
      layoutPositions?.imageScale ?? 1.0,
      layoutPositions?.imageOffsetX ?? 0,
      layoutPositions?.imageOffsetY ?? 0
    )
    layers.push(imageLayer)
  }

  // 3. Gradient overlay layer
  const overlayConfig = {
    ...layout.gradientOverlay,
    endOpacity: slide.gradientOpacity ?? layout.gradientOverlay.endOpacity
  }
  layers.push(createGradientLayer(overlayConfig))

  // 4. Header group
  layers.push(createHeaderGroup(template, headerTexts))

  // 5. Profile branding (only slide 1 with cover layout)
  if (slide.slideNumber === 1 && profileBranding && (profileBranding.displayName || profileBranding.username)) {
    const defaultBrandingX = layout.headlineArea.x
    const baseHeadlineY = layoutPositions?.headlineY !== undefined
      ? layoutPositions.headlineY
      : layout.headlineArea.y
    const defaultBrandingY = baseHeadlineY - 8

    const brandingX = percentToPixel(layoutPositions?.brandingX ?? defaultBrandingX, 'width')
    const brandingY = percentToPixel(layoutPositions?.brandingY ?? defaultBrandingY, 'height')

    const brandingGroup = await createBrandingGroup(
      profileBranding,
      brandingX,
      brandingY,
      layout.headlineColor
    )
    layers.push(brandingGroup)
  }

  // 6. Headline layer
  const headlineLayer = createHeadlineLayer(
    slide,
    layout,
    template,
    layoutPositions?.headlineY
  )
  layers.push(headlineLayer)

  // Calculate headline end Y for body positioning
  const headlineSize = slide.headlineFontSize ?? template.typography.headlineSize
  const headlineY = layoutPositions?.headlineY !== undefined
    ? percentToPixel(layoutPositions.headlineY, 'height')
    : percentToPixel(layout.headlineArea.y, 'height')

  // Approximate headline lines
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')!
  tempCtx.font = createFontString(
    headlineSize,
    template.typography.headlineFont,
    template.typography.headlineWeight,
    template.typography.headlineStyle
  )
  const headlineWidth = percentToPixel(layout.headlineArea.width, 'width')
  const headlineLines = wrapText(tempCtx, slide.headline, headlineWidth, 20)
  const lineHeight = headlineSize * 1.15
  const headlineEndY = headlineY + (headlineLines.length * lineHeight)

  // 7. Body layer
  const bodyLayer = createBodyLayer(
    slide,
    layout,
    template,
    headlineEndY,
    layoutPositions?.bodyY
  )
  layers.push(bodyLayer)

  // Build PSD structure
  const psd: Psd = {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    children: layers
  }

  return writePsd(psd)
}

// Export all slides as individual PSD files
export async function exportSlidesAsPsd(
  slides: CarouselSlide[],
  template: CarouselTemplate,
  headerTexts: HeaderTexts,
  designName: string,
  profileBranding?: ProfileBranding,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]

    onProgress?.(i + 1, slides.length)

    const psdBuffer = await createPsdFromSlide(
      slide,
      template,
      headerTexts,
      slide.slideNumber === 1 ? profileBranding : undefined
    )

    // Download the file
    const blob = new Blob([psdBuffer], { type: 'image/vnd.adobe.photoshop' })
    const link = document.createElement('a')
    link.download = `${designName}-slide-${slide.slideNumber}.psd`
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)

    // Wait between downloads to prevent browser blocking
    await new Promise(resolve => setTimeout(resolve, 300))
  }
}

// Export all slides as a ZIP file containing PSDs
export async function exportSlidesAsPsdZip(
  slides: CarouselSlide[],
  template: CarouselTemplate,
  headerTexts: HeaderTexts,
  designName: string,
  profileBranding?: ProfileBranding,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  // Dynamically import JSZip
  const JSZip = (await import('jszip')).default

  const zip = new JSZip()

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]

    onProgress?.(i + 1, slides.length)

    const psdBuffer = await createPsdFromSlide(
      slide,
      template,
      headerTexts,
      slide.slideNumber === 1 ? profileBranding : undefined
    )

    zip.file(`slide-${slide.slideNumber}.psd`, psdBuffer)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })

  // Download the ZIP
  const link = document.createElement('a')
  link.download = `${designName}-canva.zip`
  link.href = URL.createObjectURL(zipBlob)
  link.click()
  URL.revokeObjectURL(link.href)
}

// Convert pixels to mm for jsPDF
function pxToMm(px: number): number {
  return px * 0.264583
}

// Convert hex color to RGB for jsPDF
function hexToRgbValues(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 255, g: 255, b: 255 }
}

// Render only visual layers (background, image, gradient) without text
async function renderBackgroundLayers(
  slide: CarouselSlide,
  _template: CarouselTemplate,
  layout: SlideLayoutConfig,
  profileBranding?: ProfileBranding
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')!

  // Background color
  ctx.fillStyle = layout.backgroundColor
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Image
  const layoutPositions = slide.customPositions?.[slide.layoutType || 'cover']
  const imageToUse = slide.imageUrl || (slide.showMockup !== false ? MOCKUP_IMAGE_URL : null)

  if (imageToUse && layout.imageArea) {
    try {
      const img = await loadImage(imageToUse)
      drawImageCover(
        ctx, img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT,
        layoutPositions?.imageScale ?? 1.0,
        layoutPositions?.imageOffsetX ?? 0,
        layoutPositions?.imageOffsetY ?? 0
      )
    } catch (error) {
      console.error('Failed to load image for PDF:', error)
    }
  }

  // Gradient overlay
  const overlayConfig = {
    ...layout.gradientOverlay,
    endOpacity: slide.gradientOpacity ?? layout.gradientOverlay.endOpacity
  }
  drawGradientOverlay(ctx, overlayConfig)

  // Avatar (branding photo - as image, only slide 1)
  if (slide.slideNumber === 1 && profileBranding?.avatarUrl) {
    const avatarSize = 56
    const defaultBrandingX = layout.headlineArea.x
    const baseHeadlineY = layoutPositions?.headlineY !== undefined
      ? layoutPositions.headlineY
      : layout.headlineArea.y
    const defaultBrandingY = baseHeadlineY - 8

    const avatarX = percentToPixel(layoutPositions?.brandingX ?? defaultBrandingX, 'width')
    const avatarY = percentToPixel(layoutPositions?.brandingY ?? defaultBrandingY, 'height')

    try {
      const avatarImg = await loadImage(profileBranding.avatarUrl)
      const imgWidth = avatarImg.naturalWidth || avatarImg.width
      const imgHeight = avatarImg.naturalHeight || avatarImg.height
      const minDim = Math.min(imgWidth, imgHeight)
      const sx = (imgWidth - minDim) / 2
      const sy = (imgHeight - minDim) / 2

      // Create circular clip
      ctx.save()
      ctx.beginPath()
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(avatarImg, sx, sy, minDim, minDim, avatarX, avatarY, avatarSize, avatarSize)
      ctx.restore()

      // Verified badge
      if (profileBranding.isVerified) {
        const badgeX = avatarX + avatarSize - 8
        const badgeY = avatarY + avatarSize - 8
        const badgeRadius = 10

        ctx.fillStyle = '#1DA1F2'
        ctx.beginPath()
        ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(badgeX - 4, badgeY)
        ctx.lineTo(badgeX - 1, badgeY + 3)
        ctx.lineTo(badgeX + 5, badgeY - 3)
        ctx.stroke()
      }
    } catch (e) {
      console.error('Failed to load avatar for PDF:', e)
    }
  }

  return canvas
}

// Simple text wrapping for PDF (returns array of lines)
function splitTextForPdf(text: string, maxCharsPerLine: number): string[] {
  if (!text) return []

  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (testLine.length > maxCharsPerLine && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

// Export all slides as a single multi-page PDF with editable text
export async function exportSlidesAsPdfEditable(
  slides: CarouselSlide[],
  template: CarouselTemplate,
  headerTexts: HeaderTexts,
  designName: string,
  profileBranding?: ProfileBranding,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  // Dynamically import jsPDF
  const { jsPDF } = await import('jspdf')

  const widthMm = pxToMm(CANVAS_WIDTH)
  const heightMm = pxToMm(CANVAS_HEIGHT)

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [widthMm, heightMm]
  })

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]
    const layoutType = slide.layoutType || 'cover'
    const layout = template.layouts[layoutType]
    const layoutPositions = slide.customPositions?.[layoutType]

    onProgress?.(i + 1, slides.length)

    // Add new page (except first)
    if (i > 0) {
      pdf.addPage([widthMm, heightMm], 'portrait')
    }

    // 1. Background + Image + Gradient (as image)
    const bgCanvas = await renderBackgroundLayers(slide, template, layout, profileBranding)
    const bgImage = bgCanvas.toDataURL('image/jpeg', 0.95)
    pdf.addImage(bgImage, 'JPEG', 0, 0, widthMm, heightMm)

    // 2. Header texts (native text)
    if (template.header.enabled) {
      const headerColor = hexToRgbValues(template.header.textColor)
      pdf.setTextColor(headerColor.r, headerColor.g, headerColor.b)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(pxToMm(template.typography.headerSize) * 2.83) // Convert mm to pt

      const headerY = pxToMm(template.header.height / 2 + 5)

      // Left
      pdf.text(headerTexts.left.toUpperCase(), pxToMm(30), headerY)
      // Center
      pdf.text(headerTexts.center.toUpperCase(), widthMm / 2, headerY, { align: 'center' })
      // Right
      pdf.text(headerTexts.right.toUpperCase(), widthMm - pxToMm(30), headerY, { align: 'right' })
    }

    // 3. Branding text (slide 1 only)
    if (slide.slideNumber === 1 && profileBranding && (profileBranding.displayName || profileBranding.username)) {
      const defaultBrandingX = layout.headlineArea.x
      const baseHeadlineY = layoutPositions?.headlineY !== undefined
        ? layoutPositions.headlineY
        : layout.headlineArea.y
      const defaultBrandingY = baseHeadlineY - 8

      const textX = pxToMm(percentToPixel(layoutPositions?.brandingX ?? defaultBrandingX, 'width') + 56 + 16)
      const brandingY = pxToMm(percentToPixel(layoutPositions?.brandingY ?? defaultBrandingY, 'height'))

      const headlineColor = hexToRgbValues(layout.headlineColor)

      // Display name
      pdf.setTextColor(headlineColor.r, headlineColor.g, headlineColor.b)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(22 * 0.75) // Convert px to pt (approx)
      pdf.text(profileBranding.displayName || '', textX, brandingY + pxToMm(20))

      // Username
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(18 * 0.75)
      pdf.setTextColor(headlineColor.r, headlineColor.g, headlineColor.b)
      pdf.text(`@${profileBranding.username || ''}`, textX, brandingY + pxToMm(46))
    }

    // 4. Headline (native text)
    const headlineX = pxToMm(percentToPixel(layout.headlineArea.x, 'width'))
    const headlineY = pxToMm(layoutPositions?.headlineY !== undefined
      ? percentToPixel(layoutPositions.headlineY, 'height')
      : percentToPixel(layout.headlineArea.y, 'height'))

    const headlineSize = slide.headlineFontSize ?? template.typography.headlineSize
    const headlineColor = hexToRgbValues(layout.headlineColor)

    pdf.setTextColor(headlineColor.r, headlineColor.g, headlineColor.b)
    pdf.setFont('times', 'bolditalic') // Georgia-like
    pdf.setFontSize(headlineSize * 0.75) // Convert px to pt

    // Wrap headline text
    const headlineMaxChars = Math.floor((layout.headlineArea.width / 100) * 40) // Approximate chars per line
    const headlineLines = splitTextForPdf(slide.headline, headlineMaxChars)
    const headlineLineHeight = pxToMm(headlineSize * 1.15)

    let headlineAlign: 'left' | 'center' | 'right' = 'left'
    let headlineXPos = headlineX
    if (layout.headlineArea.align === 'center') {
      headlineAlign = 'center'
      headlineXPos = widthMm / 2
    } else if (layout.headlineArea.align === 'right') {
      headlineAlign = 'right'
      headlineXPos = widthMm - headlineX
    }

    headlineLines.forEach((line, idx) => {
      pdf.text(line, headlineXPos, headlineY + (idx * headlineLineHeight), { align: headlineAlign })
    })

    // 5. Body (native text)
    const bodyX = pxToMm(percentToPixel(layout.bodyArea.x, 'width'))
    const bodyY = layoutPositions?.bodyY !== undefined
      ? pxToMm(percentToPixel(layoutPositions.bodyY, 'height'))
      : headlineY + (headlineLines.length * headlineLineHeight) + pxToMm(30)

    const bodySize = slide.bodyFontSize ?? template.typography.bodySize
    const bodyColor = hexToRgbValues(layout.bodyColor)

    pdf.setTextColor(bodyColor.r, bodyColor.g, bodyColor.b)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(bodySize * 0.75)

    // Wrap body text
    const bodyMaxChars = Math.floor((layout.bodyArea.width / 100) * 50)
    const bodyLines = splitTextForPdf(slide.body, bodyMaxChars)
    const bodyLineHeight = pxToMm(bodySize * 1.4)

    let bodyAlign: 'left' | 'center' | 'right' = 'left'
    let bodyXPos = bodyX
    if (layout.bodyArea.align === 'center') {
      bodyAlign = 'center'
      bodyXPos = widthMm / 2
    } else if (layout.bodyArea.align === 'right') {
      bodyAlign = 'right'
      bodyXPos = widthMm - bodyX
    }

    bodyLines.forEach((line, idx) => {
      pdf.text(line, bodyXPos, bodyY + (idx * bodyLineHeight), { align: bodyAlign })
    })
  }

  // Save PDF
  pdf.save(`${designName}-canva.pdf`)
}
