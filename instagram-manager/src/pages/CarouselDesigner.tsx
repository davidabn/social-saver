import { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Loader2, Sparkles, Settings, Layout, FileText, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SlidesList } from '@/components/carousel/SlidesList'
import { SlideCanvas, generateFullResCanvas } from '@/components/carousel/SlideCanvas'
import { SlideEditor } from '@/components/carousel/SlideEditor'
import { ImageSearchModal } from '@/components/carousel/ImageSearchModal'
import { TemplateSelector } from '@/components/carousel/TemplateSelector'
import { ScriptImportModal } from '@/components/carousel/ScriptImportModal'
import { useGenerateSlidesWithImages, useSearchImages, useGenerateImagePrompts, useGenerateAIImages } from '@/hooks/useCarouselDesigner'
import { usePersona } from '@/hooks/useAI'
import type { CarouselSlide, CarouselDesign, ProfileBranding } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts } from '@/types/template'
import { DEFAULT_SLIDE, DEFAULT_DESIGN } from '@/types/carousel'
import { getDefaultLayoutForSlide } from '@/templates/renderers'
import type { ParsedSlide } from '@/utils/scriptParser'

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

function createNewSlide(slideNumber: number, template?: CarouselTemplate): CarouselSlide {
  return {
    id: generateId(),
    slideNumber,
    ...DEFAULT_SLIDE,
    layoutType: template ? getDefaultLayoutForSlide(slideNumber, template) : undefined
  }
}

export default function CarouselDesigner() {
  const { contentId } = useParams()
  const navigate = useNavigate()

  // Design state
  const [design, setDesign] = useState<CarouselDesign>({
    id: generateId(),
    ...DEFAULT_DESIGN,
    slides: [createNewSlide(1)]
  })

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<CarouselTemplate | null>(null)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [headerTexts, setHeaderTexts] = useState<HeaderTexts>({
    left: 'ESTUDO DE CASO',
    center: 'SEU BRAND',
    right: '© COPYRIGHT 2025'
  })

  const [selectedSlideId, setSelectedSlideId] = useState<string>(design.slides[0]?.id || '')
  const [showImageSearch, setShowImageSearch] = useState(false)
  const [showScriptImport, setShowScriptImport] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [topic, setTopic] = useState('')

  // AI generation
  const generateSlidesWithImages = useGenerateSlidesWithImages()
  const searchImages = useSearchImages()
  const generateImagePrompts = useGenerateImagePrompts()
  const generateAIImages = useGenerateAIImages()
  const [isGeneratingAIImages, setIsGeneratingAIImages] = useState(false)

  // Profile branding (from persona)
  const { data: persona } = usePersona()
  const profileBranding = useMemo<ProfileBranding | undefined>(() => {
    if (!persona?.displayName && !persona?.username) return undefined
    return {
      displayName: persona.displayName || '',
      username: persona.username || '',
      avatarUrl: persona.avatarUrl || null,
      isVerified: persona.isVerified
    }
  }, [persona])

  const selectedSlide = design.slides.find(s => s.id === selectedSlideId) || design.slides[0]

  // Update design
  const updateDesign = useCallback((updates: Partial<CarouselDesign>) => {
    setDesign(prev => ({ ...prev, ...updates }))
  }, [])

  // Update slide
  const updateSlide = useCallback((slideId: string, updates: Partial<CarouselSlide>) => {
    setDesign(prev => ({
      ...prev,
      slides: prev.slides.map(slide =>
        slide.id === slideId ? { ...slide, ...updates } : slide
      )
    }))
  }, [])

  // Handle template selection
  const handleSelectTemplate = useCallback((template: CarouselTemplate | null) => {
    setSelectedTemplate(template)

    if (template) {
      // Update header texts with template defaults
      setHeaderTexts({
        left: template.header.defaultLeft,
        center: template.header.defaultCenter,
        right: template.header.defaultRight
      })

      // Apply default layouts to existing slides
      setDesign(prev => ({
        ...prev,
        templateId: template.id,
        slides: prev.slides.map((slide, index) => ({
          ...slide,
          layoutType: getDefaultLayoutForSlide(index + 1, template)
        }))
      }))
    } else {
      // Remove template
      setDesign(prev => ({
        ...prev,
        templateId: undefined,
        slides: prev.slides.map(slide => ({
          ...slide,
          layoutType: undefined
        }))
      }))
    }
  }, [])

  // Add slide
  const handleAddSlide = useCallback(() => {
    const newSlide = createNewSlide(design.slides.length + 1, selectedTemplate || undefined)
    setDesign(prev => ({
      ...prev,
      slides: [...prev.slides, newSlide]
    }))
    setSelectedSlideId(newSlide.id)
  }, [design.slides.length, selectedTemplate])

  // Delete slide
  const handleDeleteSlide = useCallback((slideId: string) => {
    setDesign(prev => {
      const newSlides = prev.slides
        .filter(s => s.id !== slideId)
        .map((slide, index) => ({ ...slide, slideNumber: index + 1 }))

      if (selectedSlideId === slideId) {
        setSelectedSlideId(newSlides[0]?.id || '')
      }

      return { ...prev, slides: newSlides }
    })
  }, [selectedSlideId])

  // Reorder slides
  const handleReorderSlides = useCallback((newSlides: CarouselSlide[]) => {
    setDesign(prev => ({ ...prev, slides: newSlides }))
  }, [])

  // Generate slides with AI
  const handleGenerateSlides = async () => {
    if (!topic.trim()) return

    try {
      const generatedSlides = await generateSlidesWithImages.mutateAsync({
        topic,
        slideCount: 5,
        contentId
      })

      const newSlides: CarouselSlide[] = generatedSlides.map((slide, index) => ({
        id: generateId(),
        slideNumber: index + 1,
        headline: slide.headline,
        body: slide.body,
        imageUrl: slide.imageUrl || null,
        imageSearchQuery: slide.imageSearchQuery,
        backgroundColor: DEFAULT_SLIDE.backgroundColor,
        gradientColor: DEFAULT_SLIDE.gradientColor,
        gradientOpacity: DEFAULT_SLIDE.gradientOpacity,
        textColor: DEFAULT_SLIDE.textColor,
        layoutType: selectedTemplate ? getDefaultLayoutForSlide(index + 1, selectedTemplate) : undefined
      }))

      setDesign(prev => ({
        ...prev,
        theme: topic,
        slides: newSlides
      }))

      if (newSlides.length > 0) {
        setSelectedSlideId(newSlides[0].id)
      }
    } catch (error) {
      console.error('Failed to generate slides:', error)
    }
  }

  // Generate AI images for all slides
  const handleGenerateAIImages = async () => {
    if (design.slides.length === 0) return

    setIsGeneratingAIImages(true)

    try {
      // Step 1: Generate prompts for all slides
      const slidesForPrompts = design.slides.map(s => ({
        headline: s.headline,
        body: s.body
      }))

      const prompts = await generateImagePrompts.mutateAsync({
        slides: slidesForPrompts,
        theme: topic || design.theme || 'professional carousel'
      })

      // Step 2: Generate images from prompts
      const result = await generateAIImages.mutateAsync({
        prompts: prompts
      })

      // Step 3: Update slides with generated images
      if (result.images.length > 0) {
        setDesign(prev => ({
          ...prev,
          slides: prev.slides.map((slide, index) => {
            const generatedImage = result.images.find(img => img.slideIndex === index)
            if (generatedImage) {
              return { ...slide, imageUrl: generatedImage.imageUrl }
            }
            return slide
          })
        }))
      }

      if (result.errorCount > 0) {
        console.warn(`${result.errorCount} images failed to generate`)
      }
    } catch (error) {
      console.error('Failed to generate AI images:', error)
    } finally {
      setIsGeneratingAIImages(false)
    }
  }

  // Search images for current slide
  const handleSearchImages = () => {
    setShowImageSearch(true)
  }

  // Select image from search
  const handleSelectImage = (imageUrl: string) => {
    if (selectedSlide) {
      updateSlide(selectedSlide.id, { imageUrl })
    }
  }

  // Export all slides
  const handleExport = async () => {
    setIsExporting(true)

    try {
      for (const slide of design.slides) {
        const canvas = await generateFullResCanvas(
          slide,
          design.brandingText,
          selectedTemplate || undefined,
          selectedTemplate ? headerTexts : undefined,
          profileBranding
        )
        const link = document.createElement('a')
        link.download = `${design.name}-slide-${slide.slideNumber}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()

        await new Promise(resolve => setTimeout(resolve, 300))
      }
    } catch (error) {
      console.error('Failed to export slides:', error)
    } finally {
      setIsExporting(false)
    }
  }

  // Import script - cria slides a partir de texto colado
  const handleImportScript = useCallback((parsedSlides: ParsedSlide[]) => {
    const newSlides: CarouselSlide[] = parsedSlides.map((parsed) => ({
      id: generateId(),
      slideNumber: parsed.slideNumber,
      headline: parsed.headline,
      body: parsed.body,
      imageUrl: null,
      imageSearchQuery: '',
      backgroundColor: DEFAULT_SLIDE.backgroundColor,
      gradientColor: DEFAULT_SLIDE.gradientColor,
      gradientOpacity: DEFAULT_SLIDE.gradientOpacity,
      textColor: DEFAULT_SLIDE.textColor,
      layoutType: selectedTemplate
        ? getDefaultLayoutForSlide(parsed.slideNumber, selectedTemplate)
        : parsed.layoutType
    }))

    setDesign(prev => ({
      ...prev,
      slides: newSlides
    }))

    if (newSlides.length > 0) {
      setSelectedSlideId(newSlides[0].id)
    }
  }, [selectedTemplate])

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <Input
              value={design.name}
              onChange={(e) => updateDesign({ name: e.target.value })}
              className="font-semibold border-none p-0 h-auto text-lg focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Template button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateSelector(true)}
            className={selectedTemplate ? 'border-primary text-primary' : ''}
          >
            <Layout className="h-4 w-4 mr-2" />
            {selectedTemplate ? selectedTemplate.name : 'Templates'}
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configuracoes
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Configuracoes do Carrossel</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label>Texto de Branding</Label>
                  <Input
                    value={design.brandingText}
                    onChange={(e) => updateDesign({ brandingText: e.target.value })}
                    placeholder="Seu brand..."
                  />
                </div>

                {/* Header texts (only when template is active) */}
                {selectedTemplate && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium text-sm">Textos do Header</h4>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Esquerda</Label>
                      <Input
                        value={headerTexts.left}
                        onChange={(e) => setHeaderTexts(prev => ({ ...prev, left: e.target.value }))}
                        placeholder="Texto esquerda..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Centro</Label>
                      <Input
                        value={headerTexts.center}
                        onChange={(e) => setHeaderTexts(prev => ({ ...prev, center: e.target.value }))}
                        placeholder="Texto central..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Direita</Label>
                      <Input
                        value={headerTexts.right}
                        onChange={(e) => setHeaderTexts(prev => ({ ...prev, right: e.target.value }))}
                        placeholder="Texto direita..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          <Button
            onClick={handleExport}
            disabled={isExporting || design.slides.length === 0}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exportar
          </Button>
        </div>
      </header>

      {/* AI Generation Bar */}
      <div className="border-b px-4 py-3 flex items-center gap-4 bg-muted/30">
        <Sparkles className="h-5 w-5 text-primary" />
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Digite o tema do carrossel para gerar com IA..."
          className="max-w-md"
          onKeyDown={(e) => e.key === 'Enter' && handleGenerateSlides()}
        />
        <Button
          onClick={handleGenerateSlides}
          disabled={generateSlidesWithImages.isPending || !topic.trim()}
        >
          {generateSlidesWithImages.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Gerar Slides
        </Button>

        <div className="h-6 w-px bg-border" />

        <Button
          variant="outline"
          onClick={handleGenerateAIImages}
          disabled={isGeneratingAIImages || design.slides.length === 0}
          title="Gera imagens com IA para todos os slides"
        >
          {isGeneratingAIImages ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4 mr-2" />
          )}
          {isGeneratingAIImages ? 'Gerando...' : 'Gerar Imagens IA'}
        </Button>

        <div className="h-6 w-px bg-border" />

        <Button
          variant="outline"
          onClick={() => setShowScriptImport(true)}
        >
          <FileText className="h-4 w-4 mr-2" />
          Importar Script
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slides list */}
        <div className="w-48 border-r bg-muted/20">
          <SlidesList
            slides={design.slides}
            selectedSlideId={selectedSlideId}
            onSelectSlide={setSelectedSlideId}
            onAddSlide={handleAddSlide}
            onDeleteSlide={handleDeleteSlide}
            onReorderSlides={handleReorderSlides}
            template={selectedTemplate || undefined}
            headerTexts={selectedTemplate ? headerTexts : undefined}
            brandingText={design.brandingText}
          />
        </div>

        {/* Canvas preview */}
        <div className="flex-1 flex items-center justify-center bg-muted/50 p-8 overflow-auto">
          {selectedSlide ? (
            <SlideCanvas
              slide={selectedSlide}
              brandingText={design.brandingText}
              template={selectedTemplate || undefined}
              headerTexts={selectedTemplate ? headerTexts : undefined}
              profileBranding={profileBranding}
              isPreview={true}
              scale={0.5}
              onPositionChange={(updates) => updateSlide(selectedSlide.id, updates)}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <p>Nenhum slide selecionado</p>
            </div>
          )}
        </div>

        {/* Editor panel */}
        <div className="w-80 border-l bg-background overflow-y-auto">
          {selectedSlide ? (
            <SlideEditor
              slide={selectedSlide}
              onUpdate={(updates) => updateSlide(selectedSlide.id, updates)}
              onSearchImages={handleSearchImages}
              isSearching={searchImages.isPending}
              template={selectedTemplate || undefined}
              theme={topic || design.theme}
            />
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <p>Selecione um slide para editar</p>
            </div>
          )}
        </div>
      </div>

      {/* Image search modal */}
      <ImageSearchModal
        open={showImageSearch}
        onClose={() => setShowImageSearch(false)}
        onSelectImage={handleSelectImage}
        initialQuery={selectedSlide?.imageSearchQuery || selectedSlide?.headline || ''}
      />

      {/* Template selector modal */}
      <TemplateSelector
        open={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        selectedTemplateId={selectedTemplate?.id}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Script import modal */}
      <ScriptImportModal
        open={showScriptImport}
        onClose={() => setShowScriptImport(false)}
        onImport={handleImportScript}
      />
    </div>
  )
}
