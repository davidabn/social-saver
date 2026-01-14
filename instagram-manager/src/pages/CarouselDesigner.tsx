import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Download, Loader2, Sparkles, Settings, Layout, FileText, ImageIcon, ChevronDown, Palette, FolderOpen, Cloud, CloudOff, Undo2, Redo2, Type } from 'lucide-react'
import { useUndoRedo } from '@/hooks/useUndoRedo'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
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
import { PaletteSelector } from '@/components/carousel/PaletteSelector'
import { FontManagerModal } from '@/components/carousel/FontManagerModal'
import { DEFAULT_PALETTE, type ColorPalette } from '@/templates/palettes'
import { registerUserFonts } from '@/templates/fonts'
import { ScriptImportModal } from '@/components/carousel/ScriptImportModal'
import { useGenerateSlidesWithImages, useGenerateImagePrompts, useGenerateAIImages } from '@/hooks/useCarouselDesigner'
import { useSaveCarousel, useCarousel, useCarouselList, useDeleteCarousel } from '@/hooks/useCarouselPersistence'
import { usePersona } from '@/hooks/useAI'
import { useUserFonts, loadAllUserFonts } from '@/hooks/useUserFonts'
import type { CarouselSlide, CarouselDesign, ProfileBranding } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts } from '@/types/template'
import { DEFAULT_SLIDE, DEFAULT_DESIGN } from '@/types/carousel'
import { getDefaultLayoutForSlide } from '@/templates/renderers'
import { getTemplateById } from '@/templates'
import { parseCarouselScript, type ParsedSlide } from '@/utils/scriptParser'
import { exportSlidesAsPsd, exportSlidesAsPsdZip, exportSlidesAsPdfEditable } from '@/utils/psdExport'

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
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const passedScript = (location.state as { script?: string })?.script

  // Carousel persistence
  const carouselIdFromUrl = searchParams.get('id')
  const [carouselId, setCarouselId] = useState<string | null>(carouselIdFromUrl)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showSavedCarousels, setShowSavedCarousels] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isLoadingRef = useRef(false) // Evita auto-save durante carregamento

  const saveCarouselMutation = useSaveCarousel()
  const { data: loadedCarousel, isLoading: isLoadingCarousel } = useCarousel(carouselIdFromUrl)
  const { data: savedCarouselsList } = useCarouselList()
  const deleteCarouselMutation = useDeleteCarousel()

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<CarouselTemplate | null>(getTemplateById('classic') || null)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [headerTexts, setHeaderTexts] = useState<HeaderTexts>({
    left: '',
    center: '',
    right: `© COPYRIGHT ${new Date().getFullYear()}`
  })

  // Design state with undo/redo
  const {
    state: design,
    setState: setDesign,
    undo,
    redo,
    canUndo,
    canRedo,
    resetState: resetDesign
  } = useUndoRedo<CarouselDesign>({
    id: generateId(),
    ...DEFAULT_DESIGN,
    templateId: 'classic',
    slides: [createNewSlide(1, getTemplateById('classic') || undefined)]
  })

  const [selectedSlideId, setSelectedSlideId] = useState<string>(design.slides[0]?.id || '')
  const [showImageSearch, setShowImageSearch] = useState(false)
  const [showScriptImport, setShowScriptImport] = useState(false)
  const [showPaletteSelector, setShowPaletteSelector] = useState(false)
  const [showFontManager, setShowFontManager] = useState(false)
  const [customPalette, setCustomPalette] = useState<ColorPalette>(DEFAULT_PALETTE)
  const [isExporting, setIsExporting] = useState(false)
  const [topic, setTopic] = useState('')

  // User fonts
  const { data: userFonts } = useUserFonts()

  // Load user fonts when they change
  useEffect(() => {
    if (userFonts && userFonts.length > 0) {
      loadAllUserFonts(userFonts)
      registerUserFonts(userFonts) // Registra para uso nos templates
    }
  }, [userFonts])

  // AI generation
  const generateSlidesWithImages = useGenerateSlidesWithImages()
  // const searchImages = useSearchImages() // Removed: Web search feature removed from UI
  const generateImagePrompts = useGenerateImagePrompts()
  const generateAIImages = useGenerateAIImages()
  const [isGeneratingAIImages, setIsGeneratingAIImages] = useState(false)
  const [isGeneratingSingleImage, setIsGeneratingSingleImage] = useState(false)
  const [bulkSelectedAIModel, setBulkSelectedAIModel] = useState<'flux-2/pro-text-to-image' | 'gpt-image/1.5-text-to-image' | 'nano-banana-pro'>('flux-2/pro-text-to-image')

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

  // Preenche headers com dados da persona quando carrega (primeira vez apenas)
  useEffect(() => {
    if (persona && !headerTexts.left && !headerTexts.center) {
      setHeaderTexts(prev => ({
        left: persona.displayName || prev.left,
        center: persona.username || prev.center,
        right: prev.right
      }))
    }
  }, [persona])

  // Carregar carrossel da URL (se tiver id)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (loadedCarousel?.data && !hasLoadedRef.current && !isLoadingRef.current) {
      isLoadingRef.current = true
      hasLoadedRef.current = true
      console.log('[Carousel] Loading saved carousel:', loadedCarousel.id)

      // Restaurar design (usando resetDesign para não poluir histórico de undo)
      const designToLoad = loadedCarousel.data.templateId
        ? { ...loadedCarousel.data.design, templateId: loadedCarousel.data.templateId }
        : loadedCarousel.data.design
      resetDesign(designToLoad)
      setHeaderTexts(loadedCarousel.data.headerTexts)
      setCustomPalette(loadedCarousel.data.customPalette)
      setCarouselId(loadedCarousel.id)

      // Restaurar template selecionado
      if (loadedCarousel.data.templateId) {
        const template = getTemplateById(loadedCarousel.data.templateId)
        if (template) {
          setSelectedTemplate(template)
        }
      }

      // Selecionar primeiro slide
      if (loadedCarousel.data.design.slides.length > 0) {
        setSelectedSlideId(loadedCarousel.data.design.slides[0].id)
      }

      // Pequeno delay antes de permitir auto-save
      setTimeout(() => {
        isLoadingRef.current = false
      }, 1000)
    }
  }, [loadedCarousel, resetDesign])

  // Auto-save com debounce (3 segundos)
  useEffect(() => {
    // Não salva se estiver carregando
    if (isLoadingRef.current || isLoadingCarousel) return

    // Não salva se não tiver slides
    if (!design.slides.length) return

    // Cancelar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Agendar novo save
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true)
      try {
        const result = await saveCarouselMutation.mutateAsync({
          id: carouselId || undefined,
          name: design.name || 'Sem título',
          data: {
            design,
            headerTexts,
            templateId: selectedTemplate?.id || null,
            customPalette
          }
        })

        // Se era novo, guardar o ID e atualizar URL
        if (!carouselId && result.id) {
          setCarouselId(result.id)
          setSearchParams({ id: result.id }, { replace: true })
        }

        setLastSaved(new Date())
        console.log('[Carousel] Auto-saved:', result.id)
      } catch (error) {
        console.error('[Carousel] Auto-save failed:', error)
      } finally {
        setIsSaving(false)
      }
    }, 3000) // 3 segundos de debounce

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [design, headerTexts, selectedTemplate?.id, customPalette])

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

  // Callbacks memoizados para SlideCanvas (evita re-renders por função nova)
  const handlePositionChange = useCallback(
    (updates: Partial<CarouselSlide>) => {
      if (selectedSlide) {
        updateSlide(selectedSlide.id, updates)
      }
    },
    [selectedSlide?.id, updateSlide]
  )

  const handleTextChange = useCallback(
    (field: 'headline' | 'body', value: string) => {
      if (selectedSlide) {
        updateSlide(selectedSlide.id, { [field]: value })
      }
    },
    [selectedSlide?.id, updateSlide]
  )

  // Handle template selection
  const handleSelectTemplate = useCallback((template: CarouselTemplate | null) => {
    setSelectedTemplate(template)

    if (template) {
      // Update header texts - usa dados da persona se disponíveis, senão usa defaults do template
      setHeaderTexts({
        left: persona?.displayName || template.header.defaultLeft,
        center: persona?.username || template.header.defaultCenter,
        right: `© COPYRIGHT ${new Date().getFullYear()}`
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
  }, [persona])

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
        theme: topic || design.theme || 'professional carousel',
        templateId: selectedTemplate?.id
      })

      // Step 2: Generate images from prompts
      const result = await generateAIImages.mutateAsync({
        prompts: prompts,
        templateId: selectedTemplate?.id,
        model: bulkSelectedAIModel
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

  // Search images for current slide (Removed)
  // const handleSearchImages = () => {
  //   setShowImageSearch(true)
  // }

  // Select image from search
  const handleSelectImage = (imageUrl: string) => {
    if (selectedSlide) {
      updateSlide(selectedSlide.id, { imageUrl })
    }
  }

  // Export all slides as PNG (ZIP)
  const handleExportPNG = async () => {
    setIsExporting(true)

    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      for (const slide of design.slides) {
        const canvas = await generateFullResCanvas(
          slide,
          design.brandingText,
          selectedTemplate || undefined,
          selectedTemplate ? headerTexts : undefined,
          profileBranding,
          selectedTemplate ? customPalette : undefined
        )

        // Converter canvas para blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/png')
        })

        // Adicionar ao ZIP
        zip.file(`${design.name}-slide-${slide.slideNumber}.png`, blob)
      }

      // Gerar e baixar o ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(zipBlob)
      link.download = `${design.name}-slides.zip`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error('Failed to export slides:', error)
    } finally {
      setIsExporting(false)
    }
  }

  // Export all slides as PSD (for Canva import)
  const handleExportPSD = async () => {
    if (!selectedTemplate) {
      console.error('Template is required for PSD export')
      return
    }

    setIsExporting(true)

    try {
      await exportSlidesAsPsd(
        design.slides,
        selectedTemplate,
        headerTexts,
        design.name,
        profileBranding
      )
    } catch (error) {
      console.error('Failed to export PSD:', error)
    } finally {
      setIsExporting(false)
    }
  }

  // Export all slides as ZIP containing PSDs
  const handleExportPSDZip = async () => {
    if (!selectedTemplate) {
      console.error('Template is required for PSD export')
      return
    }

    setIsExporting(true)

    try {
      await exportSlidesAsPsdZip(
        design.slides,
        selectedTemplate,
        headerTexts,
        design.name,
        profileBranding
      )
    } catch (error) {
      console.error('Failed to export PSD ZIP:', error)
    } finally {
      setIsExporting(false)
    }
  }

  // Export all slides as multi-page PDF with editable text (for Canva)
  const handleExportPDF = async () => {
    if (!selectedTemplate) {
      console.error('Template is required for PDF export')
      return
    }

    setIsExporting(true)

    try {
      await exportSlidesAsPdfEditable(
        design.slides,
        selectedTemplate,
        headerTexts,
        design.name,
        profileBranding
      )
    } catch (error) {
      console.error('Failed to export PDF:', error)
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

  // Auto-importar script passado via navigation state (do ContentDetailModal)
  useEffect(() => {
    if (passedScript && !isLoadingCarousel && !isLoadingRef.current) {
      // Limpar o state para não reimportar em navegações futuras
      window.history.replaceState({}, document.title)

      // Parsear e importar diretamente
      const parsedSlides = parseCarouselScript(passedScript)
      if (parsedSlides.length > 0) {
        handleImportScript(parsedSlides)
      }
    }
  }, [passedScript, isLoadingCarousel, handleImportScript])

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
          {/* Undo/Redo buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
              title="Desfazer (Ctrl+Z)"
              className="h-8 w-8"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
              title="Refazer (Ctrl+Shift+Z)"
              className="h-8 w-8"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Save status indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : lastSaved ? (
              <>
                <Cloud className="h-4 w-4 text-green-500" />
                <span className="hidden sm:inline">Salvo às {lastSaved.toLocaleTimeString()}</span>
              </>
            ) : (
              <>
                <CloudOff className="h-4 w-4" />
                <span className="hidden sm:inline">Não salvo</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Saved carousels button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSavedCarousels(true)}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Meus Carrosseis
          </Button>

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

          {/* Palette button (only when template is selected) */}
          {selectedTemplate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPaletteSelector(true)}
              className={customPalette.id !== 'original' ? 'border-primary text-primary' : ''}
            >
              <Palette className="h-4 w-4 mr-2" />
              Cores
            </Button>
          )}

          {/* Fonts button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFontManager(true)}
          >
            <Type className="h-4 w-4 mr-2" />
            Fontes
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isExporting || design.slides.length === 0}>
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Exportar
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPNG}>
                <Download className="h-4 w-4 mr-2" />
                Exportar PNG (ZIP)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportPDF}
                disabled={!selectedTemplate}
                title={!selectedTemplate ? 'Selecione um template primeiro' : ''}
              >
                <FileText className="h-4 w-4 mr-2" />
                Exportar para Canva (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportPSD}
                disabled={!selectedTemplate}
                title={!selectedTemplate ? 'Selecione um template primeiro' : ''}
              >
                <FileText className="h-4 w-4 mr-2" />
                Exportar PSD (1 por slide)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportPSDZip}
                disabled={!selectedTemplate}
                title={!selectedTemplate ? 'Selecione um template primeiro' : ''}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar PSD em ZIP
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

        <div className="flex items-center -space-x-px">
          <Button
            variant="outline"
            onClick={handleGenerateAIImages}
            disabled={isGeneratingAIImages || design.slides.length === 0}
            className="rounded-r-none border-r-0 h-9"
          >
            {isGeneratingAIImages ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4 mr-2" />
            )}
            {isGeneratingAIImages ? 'Gerando...' : 'Gerar Imagens IA'}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-l-none h-9 w-8"
                disabled={isGeneratingAIImages || design.slides.length === 0}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs">Escolher Modelo de IA</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={bulkSelectedAIModel} onValueChange={(v) => setBulkSelectedAIModel(v as any)}>
                <DropdownMenuRadioItem value="flux-2/pro-text-to-image" className="text-xs">
                  <div className="flex flex-col">
                    <span>Flux 2 Pro</span>
                    <span className="text-[10px] text-muted-foreground">~$0.02 por imagem</span>
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="nano-banana-pro" className="text-xs">
                  <div className="flex flex-col">
                    <span>Nano Banana Pro (Google)</span>
                    <span className="text-[10px] text-muted-foreground">~$0.09 por imagem</span>
                  </div>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="gpt-image/1.5-text-to-image" className="text-xs">
                  <div className="flex flex-col">
                    <span>GPT Image 1.5</span>
                    <span className="text-[10px] text-muted-foreground">~$0.02 por imagem</span>
                  </div>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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
            customPalette={selectedTemplate ? customPalette : undefined}
          />
        </div>

        {/* Canvas preview */}
        <div className="flex-1 flex items-center justify-center bg-muted/50 p-8 overflow-hidden">
          {selectedSlide ? (
            <SlideCanvas
              slide={selectedSlide}
              brandingText={design.brandingText}
              template={selectedTemplate || undefined}
              headerTexts={selectedTemplate ? headerTexts : undefined}
              profileBranding={profileBranding}
              customPalette={selectedTemplate ? customPalette : undefined}
              isPreview={true}
              scale={0.5}
              isGenerating={isGeneratingAIImages || isGeneratingSingleImage}
              onPositionChange={handlePositionChange}
              onTextChange={handleTextChange}
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
              template={selectedTemplate || undefined}
              theme={topic || design.theme}
              isGeneratingImage={isGeneratingSingleImage}
              onGeneratingChange={setIsGeneratingSingleImage}
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

      {/* Palette selector modal */}
      <PaletteSelector
        open={showPaletteSelector}
        onClose={() => setShowPaletteSelector(false)}
        currentPalette={customPalette}
        onSelectPalette={setCustomPalette}
      />

      {/* Script import modal */}
      <ScriptImportModal
        open={showScriptImport}
        onClose={() => setShowScriptImport(false)}
        onImport={handleImportScript}
      />

      {/* Font manager modal */}
      <FontManagerModal
        open={showFontManager}
        onClose={() => setShowFontManager(false)}
      />

      {/* Saved carousels modal */}
      {showSavedCarousels && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Meus Carrosseis</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowSavedCarousels(false)}>
                ✕
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {savedCarouselsList && savedCarouselsList.length > 0 ? (
                <div className="space-y-2">
                  {savedCarouselsList.map((carousel) => (
                    <div
                      key={carousel.id}
                      className={`p-3 border rounded-lg flex items-center justify-between hover:bg-accent cursor-pointer ${carousel.id === carouselId ? 'border-primary bg-primary/5' : ''
                        }`}
                      onClick={() => {
                        setSearchParams({ id: carousel.id })
                        setCarouselId(carousel.id)
                        setShowSavedCarousels(false)
                        window.location.reload() // Recarrega para carregar o carrossel
                      }}
                    >
                      <div>
                        <p className="font-medium">{carousel.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Atualizado: {new Date(carousel.updated_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Tem certeza que deseja excluir este carrossel?')) {
                              deleteCarouselMutation.mutate(carousel.id)
                            }
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum carrossel salvo ainda. Comece a editar e ele será salvo automaticamente!
                </p>
              )}
            </div>
            <div className="p-4 border-t flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  // Criar novo carrossel (resetDesign para limpar histórico)
                  setCarouselId(null)
                  setSearchParams({})
                  resetDesign({
                    id: generateId(),
                    ...DEFAULT_DESIGN,
                    slides: [createNewSlide(1, selectedTemplate || undefined)]
                  })
                  setLastSaved(null)
                  setShowSavedCarousels(false)
                }}
              >
                Novo Carrossel
              </Button>
              <Button onClick={() => setShowSavedCarousels(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}