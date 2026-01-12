import { useRef, useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Palette, Upload, Loader2, Eye, EyeOff, Wand2, AlignLeft, AlignCenter, AlignRight, Type, Image as ImageIcon } from 'lucide-react'
import type { CarouselSlide } from '@/types/carousel'
import { getPositionKey, getLayoutPositions } from '@/types/carousel'
import type { CarouselTemplate, SlideLayoutType } from '@/types/template'
import { LayoutSelector } from './LayoutSelector'
import { FontSelectorCompact } from './FontSelector'
import { MediaLibrary } from './MediaLibrary'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useUploadImage, useGenerateImagePrompts, useGenerateAIImages } from '@/hooks/useCarouselDesigner'
import { htmlToPlainText } from '@/templates/renderers/base'

interface SlideEditorProps {
  slide: CarouselSlide
  onUpdate: (updates: Partial<CarouselSlide>) => void
  template?: CarouselTemplate
  theme?: string
  isGeneratingImage?: boolean
  onGeneratingChange?: (isGenerating: boolean) => void
}

export function SlideEditor({
  slide,
  onUpdate,
  template,
  theme = '',
  isGeneratingImage = false,
  onGeneratingChange
}: SlideEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadImage = useUploadImage()
  const generateImagePrompts = useGenerateImagePrompts()
  const generateAIImages = useGenerateAIImages()

  const [customPrompt, setCustomPrompt] = useState('')
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false)
  const [selectedAIModel, setSelectedAIModel] = useState<'flux-2/pro-text-to-image' | 'gpt-image/1.5-text-to-image' | 'nano-banana-pro'>('flux-2/pro-text-to-image')

  // Reset custom prompt when slide changes
  useEffect(() => {
    setCustomPrompt('')
  }, [slide.id])

  const handleGenerateAIImage = async () => {
    if (!customPrompt && !slide.headline && !slide.body) return
    onGeneratingChange?.(true)
    try {
      let promptToUse = customPrompt
      if (!promptToUse) {
        const prompts = await generateImagePrompts.mutateAsync({
          slides: [{ headline: slide.headline, body: slide.body }],
          theme: theme || 'professional content',
          templateId: template?.id
        })
        if (prompts.length === 0) throw new Error('No prompt generated')
        promptToUse = prompts[0].prompt
      }
      const result = await generateAIImages.mutateAsync({
        prompts: [{ slideIndex: 0, prompt: promptToUse }],
        templateId: template?.id,
        model: selectedAIModel
      })
      if (result.images.length > 0) {
        onUpdate({ imageUrl: result.images[0].imageUrl })
      } else if (result.errors.length > 0) {
        console.error('AI image generation failed:', result.errors[0].error)
      }
    } catch (error) {
      console.error('Failed to generate AI image:', error)
    } finally {
      onGeneratingChange?.(false)
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
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const currentLayout = slide.layoutType || 'cover'
  const positionKey = getPositionKey(template?.id, currentLayout)
  const layoutPositions = getLayoutPositions(slide.customPositions, template?.id, currentLayout)

  const updateLayoutFont = (key: string, value: string | number) => {
    onUpdate({
      customPositions: {
        ...slide.customPositions,
        [positionKey]: {
          ...layoutPositions,
          [key]: value
        }
      }
    })
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="content" className="w-full flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="effects">Efeitos</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4">
          <TabsContent value="content" className="space-y-4 mt-4">
            {/* Layout selector */}
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
                value={htmlToPlainText(slide.headline)}
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
                value={htmlToPlainText(slide.body)}
                onChange={(e) => onUpdate({ body: e.target.value })}
                placeholder="Texto de apoio..."
                className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>

            <div className="space-y-3 pt-2 border-t">
              <Label>Imagem de Fundo</Label>

              <div className="grid grid-cols-2 gap-2 mt-2">
                {/* Media Library Button */}
                <Dialog open={isMediaLibraryOpen} onOpenChange={setIsMediaLibraryOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="w-full">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Biblioteca
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
                    <DialogHeader>
                      <DialogTitle>Biblioteca de Imagens</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                      <MediaLibrary onSelectImage={(url) => {
                        onUpdate({ imageUrl: url })
                        setIsMediaLibraryOpen(false)
                      }} />
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadImage.isPending}
                  title="Fazer upload de imagem"
                >
                  {uploadImage.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload
                </Button>
              </div>

              {/* AI Generation Section */}
              <div className="pt-4 border-t space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="customPrompt" className="text-xs font-medium flex items-center gap-1">
                    <Wand2 className="h-3 w-3" />
                    Gerar com IA
                  </Label>
                  <textarea
                    id="customPrompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Descreva a imagem que você quer..."
                    className="w-full min-h-[60px] px-3 py-2 text-xs rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    rows={2}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Deixe vazio para gerar baseado no texto do slide.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="aiModel" className="text-xs font-medium">Modelo de IA</Label>
                  <select
                    id="aiModel"
                    value={selectedAIModel}
                    onChange={(e) => setSelectedAIModel(e.target.value as any)}
                    className="w-full h-8 px-2 py-1 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="flux-2/pro-text-to-image">Flux 2 Pro ~ $0.02</option>
                    <option value="nano-banana-pro">Nano Banana Pro (Google) ~ $0.09</option>
                    <option value="gpt-image/1.5-text-to-image">GPT Image 1.5 ~ $0.02</option>
                  </select>
                </div>

                <Button
                  variant="default"
                  className="w-full"
                  onClick={handleGenerateAIImage}
                  disabled={isGeneratingImage}
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      ✨ Gerar Imagem
                    </>
                  )}
                </Button>
              </div>

              {!slide.imageUrl && (
                <div className="flex items-center justify-between mt-2 p-2 bg-muted/50 rounded-md">
                  <span className="text-xs text-muted-foreground">Imagem placeholder</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdate({ showMockup: slide.showMockup === false ? true : false })}
                    className="h-7 px-2"
                  >
                    {slide.showMockup === false ? (
                      <><EyeOff className="h-3.5 w-3.5 mr-1" /><span className="text-xs">Oculto</span></>
                    ) : (
                      <><Eye className="h-3.5 w-3.5 mr-1" /><span className="text-xs">Visível</span></>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="design" className="space-y-4 mt-4">
            {/* Font selection controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-1">
                <Type className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium">Fontes</span>
              </div>
              <FontSelectorCompact
                label="Headline"
                selectedFont={layoutPositions?.headlineFontFamily}
                selectedWeight={layoutPositions?.headlineFontWeight}
                selectedStyle={layoutPositions?.headlineFontStyle}
                onFontChange={(font) => updateLayoutFont('headlineFontFamily', font)}
                onWeightChange={(weight) => updateLayoutFont('headlineFontWeight', weight)}
                onStyleChange={(style) => updateLayoutFont('headlineFontStyle', style)}
                defaultFont={template?.typography.headlineFont?.split(',')[0]?.replace(/"/g, '').trim() || 'Georgia'}
                defaultWeight={400}
                defaultStyle="italic"
              />
              <FontSelectorCompact
                label="Texto"
                selectedFont={layoutPositions?.bodyFontFamily}
                selectedWeight={layoutPositions?.bodyFontWeight}
                selectedStyle={layoutPositions?.bodyFontStyle}
                onFontChange={(font) => updateLayoutFont('bodyFontFamily', font)}
                onWeightChange={(weight) => updateLayoutFont('bodyFontWeight', weight)}
                onStyleChange={(style) => updateLayoutFont('bodyFontStyle', style)}
                defaultFont="Arial"
                defaultWeight={400}
                defaultStyle="normal"
              />
            </div>

            {/* Font size controls */}
            <div className="space-y-3 pt-2 border-t">
              <span className="text-xs font-medium">Tamanho das Fontes</span>
              <div className="space-y-2">
                <Label htmlFor="headlineFontSize" className="text-xs">
                  Headline: {layoutPositions?.headlineFontSize ?? slide.headlineFontSize ?? template?.typography.headlineAltSize ?? 72}px
                </Label>
                <input
                  type="range"
                  id="headlineFontSize"
                  min="40"
                  max="100"
                  step="2"
                  value={layoutPositions?.headlineFontSize ?? slide.headlineFontSize ?? template?.typography.headlineAltSize ?? 72}
                  onChange={(e) => updateLayoutFont('headlineFontSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyFontSize" className="text-xs">
                  Texto: {layoutPositions?.bodyFontSize ?? slide.bodyFontSize ?? template?.typography.bodySize ?? 30}px
                </Label>
                <input
                  type="range"
                  id="bodyFontSize"
                  min="18"
                  max="60"
                  step="1"
                  value={layoutPositions?.bodyFontSize ?? slide.bodyFontSize ?? template?.typography.bodySize ?? 30}
                  onChange={(e) => updateLayoutFont('bodyFontSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>

            {/* Alignment Controls */}
            <div className="space-y-3 pt-2 border-t">
              <span className="text-xs font-medium">Alinhamento</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Headline</Label>
                  <div className="flex gap-1">
                    {(['left', 'center', 'right'] as const).map((align) => {
                      const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight
                      const currentAlign = layoutPositions?.headlineAlign
                      return (
                        <Button
                          key={align}
                          variant={currentAlign === align || (!currentAlign && align === 'left') ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => updateLayoutFont('headlineAlign', align)}
                          className="flex-1 h-8"
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
                      const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight
                      const currentAlign = layoutPositions?.bodyAlign
                      return (
                        <Button
                          key={align}
                          variant={currentAlign === align || (!currentAlign && align === 'left') ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => updateLayoutFont('bodyAlign', align)}
                          className="flex-1 h-8"
                        >
                          <Icon className="h-4 w-4" />
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Branding scale (slide 1) */}
            {slide.slideNumber === 1 && (slide.layoutType === 'cover' || !slide.layoutType) && (
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="brandingScale" className="text-xs">
                  Tamanho do Branding: {Math.round((layoutPositions?.brandingScale ?? 1.0) * 100)}%
                </Label>
                <input
                  type="range"
                  id="brandingScale"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={layoutPositions?.brandingScale ?? 1.0}
                  onChange={(e) => updateLayoutFont('brandingScale', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Escala do avatar, nome e username
                </p>
              </div>
            )}

            {/* Colors (only if not template) */}
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
              </div>
            )}

            {template && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Template ativo: <span className="font-medium">{template.name}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  As cores são definidas pelo template.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="effects" className="space-y-4 mt-4">
            {/* Gradient opacity */}
            <div className="space-y-2">
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

            {/* Grain texture */}
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="grainIntensity" className="text-xs">
                Textura (Grain): {slide.grainIntensity || 0}%
              </Label>
              <input
                type="range"
                id="grainIntensity"
                min="0"
                max="100"
                step="5"
                value={slide.grainIntensity || 0}
                onChange={(e) => onUpdate({ grainIntensity: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="text-xs text-muted-foreground">Adiciona textura granulada ao fundo</p>
            </div>


          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
