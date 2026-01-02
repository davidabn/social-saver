import { Check, Palette, RotateCcw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { PRESET_PALETTES, DEFAULT_PALETTE, type ColorPalette } from '@/templates/palettes'

interface PaletteSelectorProps {
  open: boolean
  onClose: () => void
  currentPalette: ColorPalette
  onSelectPalette: (palette: ColorPalette) => void
}

export function PaletteSelector({
  open,
  onClose,
  currentPalette,
  onSelectPalette
}: PaletteSelectorProps) {
  // Verifica se a paleta atual é uma pré-definida
  const isPresetSelected = PRESET_PALETTES.some(p =>
    p.background === currentPalette.background &&
    p.backgroundAlt === currentPalette.backgroundAlt &&
    p.headline === currentPalette.headline &&
    p.body === currentPalette.body &&
    p.accent === currentPalette.accent
  )

  const handleColorChange = (key: keyof ColorPalette, value: string) => {
    if (key === 'id' || key === 'name') return
    onSelectPalette({
      ...currentPalette,
      id: 'custom',
      name: 'Personalizado',
      [key]: value
    })
  }

  const handlePresetSelect = (palette: ColorPalette) => {
    onSelectPalette(palette)
  }

  const handleReset = () => {
    onSelectPalette(DEFAULT_PALETTE)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Paleta de Cores
          </DialogTitle>
        </DialogHeader>

        {/* Paletas pré-definidas */}
        <div className="mt-4">
          <Label className="text-sm font-medium text-muted-foreground mb-3 block">
            PALETAS PRE-DEFINIDAS
          </Label>
          <div className="grid grid-cols-4 gap-3">
            {PRESET_PALETTES.map((palette) => {
              const isSelected =
                palette.background === currentPalette.background &&
                palette.backgroundAlt === currentPalette.backgroundAlt &&
                palette.headline === currentPalette.headline &&
                palette.body === currentPalette.body &&
                palette.accent === currentPalette.accent

              return (
                <button
                  key={palette.id}
                  onClick={() => handlePresetSelect(palette)}
                  className={cn(
                    'relative flex flex-col p-3 rounded-lg border-2 transition-all',
                    'hover:border-primary hover:shadow-md',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border bg-card'
                  )}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}

                  {/* Preview de cores */}
                  <div className="flex gap-0.5 mb-2 rounded overflow-hidden">
                    <div className="h-6 flex-1" style={{ backgroundColor: palette.background }} />
                    <div className="h-6 flex-1" style={{ backgroundColor: palette.backgroundAlt }} />
                    <div className="h-6 flex-1" style={{ backgroundColor: palette.accent }} />
                  </div>

                  <span className="text-xs font-medium text-center">{palette.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Personalizar cores */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-medium text-muted-foreground">
              PERSONALIZAR
            </Label>
            {!isPresetSelected && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                Customizado
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ColorInput
              label="Fundo Claro"
              value={currentPalette.background}
              onChange={(v) => handleColorChange('background', v)}
            />
            <ColorInput
              label="Fundo Escuro"
              value={currentPalette.backgroundAlt}
              onChange={(v) => handleColorChange('backgroundAlt', v)}
            />
            <ColorInput
              label="Titulo (fundo claro)"
              value={currentPalette.headline}
              onChange={(v) => handleColorChange('headline', v)}
            />
            <ColorInput
              label="Titulo (fundo escuro)"
              value={currentPalette.headlineAlt}
              onChange={(v) => handleColorChange('headlineAlt', v)}
            />
            <ColorInput
              label="Texto (fundo claro)"
              value={currentPalette.body}
              onChange={(v) => handleColorChange('body', v)}
            />
            <ColorInput
              label="Texto (fundo escuro)"
              value={currentPalette.bodyAlt}
              onChange={(v) => handleColorChange('bodyAlt', v)}
            />
            <ColorInput
              label="Destaque"
              value={currentPalette.accent}
              onChange={(v) => handleColorChange('accent', v)}
              description="Underline, separador"
            />
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Resetar para Original
          </Button>
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ColorInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  description?: string
}

function ColorInput({ label, value, onChange, description }: ColorInputProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-border"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono text-sm uppercase"
          maxLength={7}
        />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
