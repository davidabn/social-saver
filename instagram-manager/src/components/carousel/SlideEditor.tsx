import { useRef, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Palette, Upload, Loader2, Eye, EyeOff, Wand2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import type { CarouselSlide } from '@/types/carousel'
import type { CarouselTemplate, SlideLayoutType } from '@/types/template'
import { LayoutSelector } from './LayoutSelector'
import { useUploadImage, useGenerateImagePrompts, useGenerateAIImages } from '@/hooks/useCarouselDesigner'

interface SlideEditorProps {
  slide: CarouselSlide
  onUpdate: (updates: Partial<CarouselSlide>) => void
  onSearchImages: () => void
  isSearching?: boolean
  template?: CarouselTemplate
  theme?: string  // Tema do carrossel para gerar imagens
}

export function SlideEditor({
  slide,
  onUpdate,
  onSearchImages,
  isSearching = false,
  template,
  theme = ''
}: SlideEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadImage = useUploadImage()
  const generateImagePrompts = useGenerateImagePrompts()
  const generateAIImages = useGenerateAIImages()
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  const handleGenerateAIImage = async () => {
    if (!slide.headline && !slide.body) return

    setIsGeneratingImage(true)

    try {
      // Generate prompt for this slide
      const prompts = await generateImagePrompts.mutateAsync({
        slides: [{ headline: slide.headline, body: slide.body }],
        theme: theme || 'professional content'
      })

      if (prompts.length === 0) {
        throw new Error('No prompt generated')
      }

      // Generate image from prompt
      const result = await generateAIImages.mutateAsync({
        prompts: [{ slideIndex: 0, prompt: prompts[0].prompt }]
      })

      if (result.images.length > 0) {
        onUpdate({ imageUrl: result.images[0].imageUrl })
      } else if (result.errors.length > 0) {
        console.error('AI image generation failed:', result.errors[0].error)
      }
    } catch (error) {
      console.error('Failed to generate AI image:', error)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const url = await uploadImage.mutateAsync(file)
      onUpdate({ imageUrl: url })
    } catch (error) {
      console.error('Failed to upload image:', error)
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  return (
    <div className="space-y-4 p-4">
      {/* Layout selector (only when template is active) */}
      {template && (
        <div className="pb-3 border-b">
          <LayoutSelector
            template={template}
            value={slide.layoutType}
            onChange={(layout: SlideLayoutType) => onUpdate({ layoutType: layout })}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <textarea
          id="headline"
          value={slide.headline}
          onChange={(e) => onUpdate({ headline: e.target.value })}
          placeholder="Titulo impactante..."
          className="w-full min-h-[60px] px-3 py-2 text-sm font-semibold rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Texto</Label>
        <textarea
          id="body"
          value={slide.body}
          onChange={(e) => onUpdate({ body: e.target.value })}
          placeholder="Texto de apoio..."
          className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      <div className="space-y-2">
        <Label>Imagem de Fundo</Label>
        <div className="flex gap-2">
          <Input
            value={slide.imageUrl || ''}
            onChange={(e) => onUpdate({ imageUrl: e.target.value || null })}
            placeholder="URL da imagem..."
            className="flex-1"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadImage.isPending}
            title="Fazer upload de imagem"
          >
            {uploadImage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onSearchImages}
            disabled={isSearching}
            title="Buscar imagens"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleGenerateAIImage}
            disabled={isGeneratingImage || (!slide.headline && !slide.body)}
            title="Gerar imagem com IA"
          >
            {isGeneratingImage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
          </Button>
        </div>
        {isGeneratingImage && (
          <p className="text-xs text-muted-foreground">Gerando imagem com IA...</p>
        )}
        {uploadImage.isPending && (
          <p className="text-xs text-muted-foreground">Fazendo upload...</p>
        )}
        {uploadImage.isError && (
          <p className="text-xs text-red-500">
            Erro: {uploadImage.error?.message || 'Falha no upload. Max 10MB.'}
          </p>
        )}
        {/* Toggle para mostrar/ocultar mockup quando não tem imagem */}
        {!slide.imageUrl && (
          <div className="flex items-center justify-between mt-2 p-2 bg-muted/50 rounded-md">
            <span className="text-xs text-muted-foreground">
              Imagem placeholder
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdate({ showMockup: slide.showMockup === false ? true : false })}
              className="h-7 px-2"
              title={slide.showMockup === false ? 'Mostrar placeholder' : 'Ocultar placeholder'}
            >
              {slide.showMockup === false ? (
                <>
                  <EyeOff className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">Oculto</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  <span className="text-xs">Visível</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Color controls (hidden when template is active, as template controls colors) */}
      {!template && (
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Cores</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="bgColor" className="text-xs">Fundo</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  id="bgColor"
                  value={slide.backgroundColor}
                  onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <Input
                  value={slide.backgroundColor}
                  onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                  className="flex-1 h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="textColor" className="text-xs">Texto</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  id="textColor"
                  value={slide.textColor}
                  onChange={(e) => onUpdate({ textColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <Input
                  value={slide.textColor}
                  onChange={(e) => onUpdate({ textColor: e.target.value })}
                  className="flex-1 h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="gradientOpacity" className="text-xs">
              Opacidade do Gradiente: {Math.round(slide.gradientOpacity * 100)}%
            </Label>
            <input
              type="range"
              id="gradientOpacity"
              min="0"
              max="1"
              step="0.05"
              value={slide.gradientOpacity}
              onChange={(e) => onUpdate({ gradientOpacity: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Gradient opacity control (always visible) */}
      <div className="space-y-2 pt-2 border-t">
        <Label htmlFor="gradientOpacity" className="text-xs">
          Opacidade do Gradiente: {Math.round(slide.gradientOpacity * 100)}%
        </Label>
        <input
          type="range"
          id="gradientOpacity"
          min="0"
          max="1"
          step="0.05"
          value={slide.gradientOpacity}
          onChange={(e) => onUpdate({ gradientOpacity: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      {/* Font size controls */}
      <div className="space-y-3 pt-2 border-t">
        <span className="text-xs font-medium">Tamanho das Fontes</span>

        <div className="space-y-2">
          {(() => {
            const currentLayout = slide.layoutType || 'cover'
            const layoutHeadlineSize = slide.customPositions?.[currentLayout]?.headlineFontSize
            const displaySize = layoutHeadlineSize ?? slide.headlineFontSize ?? template?.typography.headlineAltSize ?? 72
            return (
              <>
                <Label htmlFor="headlineFontSize" className="text-xs">
                  Headline: {displaySize}px
                </Label>
                <input
                  type="range"
                  id="headlineFontSize"
                  min="40"
                  max="100"
                  step="2"
                  value={displaySize}
                  onChange={(e) => onUpdate({
                    customPositions: {
                      ...slide.customPositions,
                      [currentLayout]: {
                        ...slide.customPositions?.[currentLayout],
                        headlineFontSize: parseInt(e.target.value)
                      }
                    }
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </>
            )
          })()}
        </div>

        <div className="space-y-2">
          {(() => {
            const currentLayout = slide.layoutType || 'cover'
            const layoutBodySize = slide.customPositions?.[currentLayout]?.bodyFontSize
            const displaySize = layoutBodySize ?? slide.bodyFontSize ?? template?.typography.bodySize ?? 30
            return (
              <>
                <Label htmlFor="bodyFontSize" className="text-xs">
                  Texto: {displaySize}px
                </Label>
                <input
                  type="range"
                  id="bodyFontSize"
                  min="18"
                  max="60"
                  step="1"
                  value={displaySize}
                  onChange={(e) => onUpdate({
                    customPositions: {
                      ...slide.customPositions,
                      [currentLayout]: {
                        ...slide.customPositions?.[currentLayout],
                        bodyFontSize: parseInt(e.target.value)
                      }
                    }
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </>
            )
          })()}
        </div>
      </div>

      {/* Text alignment controls */}
      <div className="space-y-3 pt-2 border-t">
        <span className="text-xs font-medium">Alinhamento do Texto</span>

        <div className="space-y-2">
          <Label className="text-xs">Headline</Label>
          <div className="flex gap-1">
            {(['left', 'center', 'right'] as const).map((align) => {
              const currentLayout = slide.layoutType || 'cover'
              const currentAlign = slide.customPositions?.[currentLayout]?.headlineAlign
              const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight
              return (
                <Button
                  key={align}
                  variant={currentAlign === align || (!currentAlign && align === 'left') ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => onUpdate({
                    customPositions: {
                      ...slide.customPositions,
                      [currentLayout]: {
                        ...slide.customPositions?.[currentLayout],
                        headlineAlign: align
                      }
                    }
                  })}
                  className="flex-1 h-8"
                  title={align === 'left' ? 'Alinhar à esquerda' : align === 'center' ? 'Centralizar' : 'Alinhar à direita'}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Texto</Label>
          <div className="flex gap-1">
            {(['left', 'center', 'right'] as const).map((align) => {
              const currentLayout = slide.layoutType || 'cover'
              const currentAlign = slide.customPositions?.[currentLayout]?.bodyAlign
              const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight
              return (
                <Button
                  key={align}
                  variant={currentAlign === align || (!currentAlign && align === 'left') ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => onUpdate({
                    customPositions: {
                      ...slide.customPositions,
                      [currentLayout]: {
                        ...slide.customPositions?.[currentLayout],
                        bodyAlign: align
                      }
                    }
                  })}
                  className="flex-1 h-8"
                  title={align === 'left' ? 'Alinhar à esquerda' : align === 'center' ? 'Centralizar' : 'Alinhar à direita'}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Template info when active */}
      {template && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Template ativo: <span className="font-medium">{template.name}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            As cores sao controladas pelo template.
          </p>
        </div>
      )}
    </div>
  )
}
