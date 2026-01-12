import type { CarouselSlide } from '@/types/carousel'
import type { HeaderTexts } from '@/types/template'
import type { ColorPalette } from '@/templates/palettes'
import { SlideCanvas } from './SlideCanvas'
import { getTemplateById } from '@/templates'

interface CarouselThumbnailProps {
    firstSlide: CarouselSlide | null
    templateId: string | null
    headerTexts: HeaderTexts | null
    customPalette: ColorPalette | null
}

export function CarouselThumbnail({
    firstSlide,
    templateId,
    headerTexts,
    customPalette
}: CarouselThumbnailProps) {
    // Fallback se não houver slide
    if (!firstSlide) {
        return (
            <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                <span className="text-4xl text-muted-foreground/50">📸</span>
            </div>
        )
    }

    // Buscar template se houver ID
    const template = templateId ? getTemplateById(templateId) : undefined

    return (
        <div className="aspect-square bg-muted rounded-md overflow-hidden">
            <SlideCanvas
                slide={firstSlide}
                brandingText=""
                template={template}
                headerTexts={headerTexts || undefined}
                customPalette={customPalette || undefined}
                isPreview={true}
                scale={0.25}
            />
        </div>
    )
}
