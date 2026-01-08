import { useEffect, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Italic, Type } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  fontsByCategory,
  categoryNames,
  weightNames,
  getFontByName,
  type FontDefinition
} from '@/templates/fonts'
import { useFonts } from '@/hooks/useFonts'

interface FontSelectorProps {
  label: string
  selectedFont?: string
  selectedWeight?: number
  selectedStyle?: 'normal' | 'italic'
  onFontChange: (font: string) => void
  onWeightChange: (weight: number) => void
  onStyleChange: (style: 'normal' | 'italic') => void
  defaultFont?: string
  defaultWeight?: number
  defaultStyle?: 'normal' | 'italic'
}

export function FontSelector({
  label,
  selectedFont,
  selectedWeight,
  selectedStyle,
  onFontChange,
  onWeightChange,
  onStyleChange,
  defaultFont = 'Georgia',
  defaultWeight = 400,
  defaultStyle = 'normal'
}: FontSelectorProps) {
  const { loadFont } = useFonts()

  // Fonte atual (selecionada ou default)
  const currentFontName = selectedFont || defaultFont
  const currentWeight = selectedWeight || defaultWeight
  const currentStyle = selectedStyle || defaultStyle

  // Busca definição da fonte atual
  const currentFontDef = useMemo(() =>
    getFontByName(currentFontName),
    [currentFontName]
  )

  // Pré-carrega a fonte selecionada
  useEffect(() => {
    if (currentFontName) {
      loadFont(currentFontName)
    }
  }, [currentFontName, loadFont])

  // Verifica se a fonte suporta itálico
  const supportsItalic = currentFontDef?.styles.includes('italic') ?? false

  // Pesos disponíveis para a fonte atual
  const availableWeights = currentFontDef?.weights || [400, 700]

  // Estilo CSS para preview
  const previewStyle = useMemo(() => ({
    fontFamily: currentFontDef?.family || currentFontName,
    fontWeight: currentWeight,
    fontStyle: currentStyle
  }), [currentFontDef, currentFontName, currentWeight, currentStyle])

  return (
    <div className="space-y-2">
      <Label className="text-xs flex items-center gap-1">
        <Type className="h-3 w-3" />
        {label}
      </Label>

      <div className="flex gap-1">
        {/* Seletor de Família */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-start text-xs h-8 overflow-hidden"
              style={previewStyle}
            >
              <span className="truncate">{currentFontName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto">
            {Object.entries(fontsByCategory).map(([category, fonts]) => {
              if (fonts.length === 0) return null
              return (
                <div key={category}>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {categoryNames[category] || category}
                  </DropdownMenuLabel>
                  {fonts.map(font => (
                    <FontMenuItem
                      key={font.name}
                      font={font}
                      isSelected={font.name === currentFontName}
                      onSelect={() => {
                        onFontChange(font.name)
                        // Reseta peso se não disponível na nova fonte
                        if (!font.weights.includes(currentWeight)) {
                          onWeightChange(font.weights[0])
                        }
                        // Reseta estilo se não disponível
                        if (currentStyle === 'italic' && !font.styles.includes('italic')) {
                          onStyleChange('normal')
                        }
                      }}
                    />
                  ))}
                  <DropdownMenuSeparator />
                </div>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Seletor de Peso */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-20 text-xs h-8"
            >
              {weightNames[currentWeight] || currentWeight}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {availableWeights.map(weight => (
              <DropdownMenuItem
                key={weight}
                onClick={() => onWeightChange(weight)}
                className={weight === currentWeight ? 'bg-accent' : ''}
              >
                <span style={{ fontWeight: weight }}>
                  {weightNames[weight] || weight}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Toggle Itálico */}
        <Button
          variant={currentStyle === 'italic' ? 'default' : 'outline'}
          size="sm"
          className="w-8 h-8 p-0"
          disabled={!supportsItalic}
          onClick={() => onStyleChange(currentStyle === 'italic' ? 'normal' : 'italic')}
          title={supportsItalic ? 'Itálico' : 'Esta fonte não suporta itálico'}
        >
          <Italic className="h-3 w-3" />
        </Button>
      </div>

      {/* Preview do texto */}
      <div
        className="text-sm p-2 bg-muted/50 rounded border text-center"
        style={previewStyle}
      >
        Exemplo de texto
      </div>
    </div>
  )
}

// Componente de item de fonte no dropdown
function FontMenuItem({
  font,
  isSelected,
  onSelect
}: {
  font: FontDefinition
  isSelected: boolean
  onSelect: () => void
}) {
  const { loadFont } = useFonts()

  // Carrega a fonte quando o item é renderizado (lazy loading)
  useEffect(() => {
    // Só pré-carrega se não for fonte do sistema
    if (font.source === 'google') {
      // Delay para não carregar todas de uma vez
      const timer = setTimeout(() => {
        loadFont(font.name)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [font, loadFont])

  return (
    <DropdownMenuItem
      onClick={onSelect}
      className={isSelected ? 'bg-accent' : ''}
    >
      <span
        style={{
          fontFamily: font.family,
          fontWeight: 400
        }}
        className="truncate"
      >
        {font.name}
      </span>
      {font.source === 'google' && (
        <span className="ml-auto text-[10px] text-muted-foreground">G</span>
      )}
    </DropdownMenuItem>
  )
}

// Versão compacta para espaços menores
export function FontSelectorCompact({
  label,
  selectedFont,
  selectedWeight,
  selectedStyle,
  onFontChange,
  onWeightChange,
  onStyleChange,
  defaultFont = 'Georgia',
  defaultWeight = 400,
  defaultStyle = 'normal'
}: FontSelectorProps) {
  const { loadFont } = useFonts()

  const currentFontName = selectedFont || defaultFont
  const currentWeight = selectedWeight || defaultWeight
  const currentStyle = selectedStyle || defaultStyle

  const currentFontDef = getFontByName(currentFontName)
  const supportsItalic = currentFontDef?.styles.includes('italic') ?? false

  useEffect(() => {
    if (currentFontName) {
      loadFont(currentFontName)
    }
  }, [currentFontName, loadFont])

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-1">
        {/* Font Family Select */}
        <select
          className="flex-1 h-7 text-xs rounded border bg-background px-2"
          value={currentFontName}
          onChange={(e) => {
            const font = getFontByName(e.target.value)
            onFontChange(e.target.value)
            if (font && !font.weights.includes(currentWeight)) {
              onWeightChange(font.weights[0])
            }
          }}
          style={{ fontFamily: currentFontDef?.family }}
        >
          {Object.entries(fontsByCategory).map(([category, fonts]) => {
            if (fonts.length === 0) return null
            return (
              <optgroup key={category} label={categoryNames[category]}>
                {fonts.map(font => (
                  <option
                    key={font.name}
                    value={font.name}
                    style={{ fontFamily: font.family }}
                  >
                    {font.name}
                  </option>
                ))}
              </optgroup>
            )
          })}
        </select>

        {/* Weight Select */}
        <select
          className="w-16 h-7 text-xs rounded border bg-background px-1"
          value={currentWeight}
          onChange={(e) => onWeightChange(Number(e.target.value))}
        >
          {(currentFontDef?.weights || [400, 700]).map(w => (
            <option key={w} value={w}>{weightNames[w] || w}</option>
          ))}
        </select>

        {/* Italic Toggle */}
        <button
          type="button"
          className={`w-7 h-7 rounded border flex items-center justify-center ${
            currentStyle === 'italic'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background'
          } ${!supportsItalic ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={!supportsItalic}
          onClick={() => onStyleChange(currentStyle === 'italic' ? 'normal' : 'italic')}
        >
          <Italic className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
