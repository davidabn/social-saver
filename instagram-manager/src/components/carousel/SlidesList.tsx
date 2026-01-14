import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CarouselSlide } from '@/types/carousel'
import type { CarouselTemplate, HeaderTexts } from '@/types/template'
import type { ColorPalette } from '@/templates/palettes'
import { cn } from '@/lib/utils'
import { SlideCanvas } from './SlideCanvas'

interface SlidesListProps {
  slides: CarouselSlide[]
  selectedSlideId: string | null
  onSelectSlide: (slideId: string) => void
  onAddSlide: () => void
  onDeleteSlide: (slideId: string) => void
  onReorderSlides: (slides: CarouselSlide[]) => void
  template?: CarouselTemplate
  headerTexts?: HeaderTexts
  brandingText: string
  customPalette?: ColorPalette
  personaFonts?: {
    headlineFont?: string
    headlineWeight?: number
    headlineStyle?: 'normal' | 'italic'
    bodyFont?: string
    bodyWeight?: number
    bodyStyle?: 'normal' | 'italic'
  }
}

export function SlidesList({
  slides,
  selectedSlideId,
  onSelectSlide,
  onAddSlide,
  onDeleteSlide,
  onReorderSlides,
  template,
  headerTexts,
  brandingText,
  customPalette,
  personaFonts
}: SlidesListProps) {
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('slideIndex', index.toString())
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('slideIndex'))

    if (dragIndex === dropIndex) return

    const newSlides = [...slides]
    const [draggedSlide] = newSlides.splice(dragIndex, 1)
    newSlides.splice(dropIndex, 0, draggedSlide)

    // Update slide numbers
    const reorderedSlides = newSlides.map((slide, index) => ({
      ...slide,
      slideNumber: index + 1
    }))

    onReorderSlides(reorderedSlides)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">Slides</h3>
        {template && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {template.name}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onClick={() => onSelectSlide(slide.id)}
            className={cn(
              'group relative rounded-lg border-2 cursor-pointer transition-all',
              'hover:border-primary/50',
              selectedSlideId === slide.id
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-border'
            )}
          >
            {/* Drag handle */}
            <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Delete button */}
            {slides.length > 1 && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteSlide(slide.id)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}

            {/* Slide thumbnail */}
            <div className="aspect-[4/5] rounded-md overflow-hidden relative">
              {template ? (
                // Use SlideCanvas for template preview
                <div className="w-full h-full">
                  <SlideCanvas
                    slide={slide}
                    brandingText={brandingText}
                    template={template}
                    headerTexts={headerTexts}
                    customPalette={customPalette}
                    personaFonts={personaFonts}
                    isPreview={true}
                    scale={0.12}
                  />
                </div>
              ) : (
                // Default thumbnail (without template)
                <div
                  className="w-full h-full relative"
                  style={{ backgroundColor: slide.backgroundColor }}
                >
                  {/* Background image */}
                  {slide.imageUrl && (
                    <img
                      src={slide.imageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}

                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to bottom, transparent 30%, rgba(0,0,0,${slide.gradientOpacity}) 100%)`
                    }}
                  />

                  {/* Text preview */}
                  <div className="absolute bottom-1 left-1 right-1 text-white">
                    <p
                      className="text-[8px] font-bold leading-tight truncate"
                      style={{ color: slide.textColor }}
                    >
                      {slide.headline || 'Headline...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Slide number badge */}
              <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded z-10">
                {slide.slideNumber}
              </div>

              {/* Layout type badge (when template is active) */}
              {template && slide.layoutType && (
                <div className="absolute top-1 right-1 bg-primary/80 text-primary-foreground text-[6px] px-1 py-0.5 rounded z-10 uppercase">
                  {slide.layoutType}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onAddSlide}
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Slide
        </Button>
      </div>
    </div>
  )
}
