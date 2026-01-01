import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Palette } from 'lucide-react'
import type { CarouselSlide } from '@/types/carousel'
import type { CarouselTemplate, SlideLayoutType } from '@/types/template'
import { LayoutSelector } from './LayoutSelector'

interface SlideEditorProps {
  slide: CarouselSlide
  onUpdate: (updates: Partial<CarouselSlide>) => void
  onSearchImages: () => void
  isSearching?: boolean
  template?: CarouselTemplate
}

export function SlideEditor({
  slide,
  onUpdate,
  onSearchImages,
  isSearching = false,
  template
}: SlideEditorProps) {
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
          <Button
            variant="outline"
            size="icon"
            onClick={onSearchImages}
            disabled={isSearching}
            title="Buscar imagens"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
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
          <Label htmlFor="headlineFontSize" className="text-xs">
            Headline: {slide.headlineFontSize || template?.typography.headlineAltSize || 72}px
          </Label>
          <input
            type="range"
            id="headlineFontSize"
            min="40"
            max="100"
            step="2"
            value={slide.headlineFontSize || template?.typography.headlineAltSize || 72}
            onChange={(e) => onUpdate({ headlineFontSize: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bodyFontSize" className="text-xs">
            Texto: {slide.bodyFontSize || template?.typography.bodySize || 30}px
          </Label>
          <input
            type="range"
            id="bodyFontSize"
            min="18"
            max="60"
            step="1"
            value={slide.bodyFontSize || template?.typography.bodySize || 30}
            onChange={(e) => onUpdate({ bodyFontSize: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
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
