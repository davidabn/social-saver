import { Bold, Italic, Underline, Type, Palette, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'

// Fontes disponíveis
const FONTS = [
  { name: 'Georgia', label: 'Georgia' },
  { name: 'Montserrat', label: 'Montserrat' },
  { name: 'Oswald', label: 'Oswald' },
  { name: 'Playfair Display', label: 'Playfair Display' },
  { name: 'Inter', label: 'Inter' },
  { name: 'Roboto', label: 'Roboto' },
  { name: 'Open Sans', label: 'Open Sans' },
  { name: 'Lato', label: 'Lato' },
  { name: 'Poppins', label: 'Poppins' },
  { name: 'Raleway', label: 'Raleway' }
]

// Cores predefinidas
const COLORS = [
  { value: '#ffffff', label: 'Branco' },
  { value: '#000000', label: 'Preto' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#f97316', label: 'Laranja' },
  { value: '#eab308', label: 'Amarelo' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#6b7280', label: 'Cinza' }
]

interface TextFormatToolbarProps {
  position: { x: number; y: number }
  onBold: () => void
  onItalic: () => void
  onUnderline: () => void
  onFont?: (font: string) => void
  onColor?: (color: string) => void
  currentFormat: {
    bold: boolean
    italic: boolean
    underline: boolean
    font?: string
    color?: string
  }
}

export function TextFormatToolbar({
  position,
  onBold,
  onItalic,
  onUnderline,
  onFont,
  onColor,
  currentFormat
}: TextFormatToolbarProps) {
  return (
    <div
      id="text-format-toolbar"
      className="fixed z-[1001] flex items-center gap-1 p-1 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)'
      }}
      onMouseDown={(e) => e.preventDefault()} // Previne perda de seleção
    >
      {/* Botões de formatação básica */}
      <Button
        size="sm"
        variant={currentFormat.bold ? 'secondary' : 'ghost'}
        className="h-8 w-8 p-0"
        onClick={onBold}
        title="Negrito (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={currentFormat.italic ? 'secondary' : 'ghost'}
        className="h-8 w-8 p-0"
        onClick={onItalic}
        title="Itálico (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        size="sm"
        variant={currentFormat.underline ? 'secondary' : 'ghost'}
        className="h-8 w-8 p-0"
        onClick={onUnderline}
        title="Sublinhado (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </Button>

      {/* Separador */}
      <div className="w-px h-6 bg-border mx-1" />

      {/* Seletor de Fonte */}
      {onFont && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 gap-1"
              title="Fonte"
            >
              <Type className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="max-h-64 overflow-y-auto"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenuLabel>Fonte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {FONTS.map((font) => (
              <DropdownMenuItem
                key={font.name}
                onClick={() => onFont(font.name)}
                className="cursor-pointer"
                style={{ fontFamily: font.name }}
              >
                <span className={currentFormat.font === font.name ? 'font-bold' : ''}>
                  {font.label}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Seletor de Cor */}
      {onColor && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 gap-1"
              title="Cor do texto"
            >
              <Palette className="h-4 w-4" />
              <div
                className="w-3 h-3 rounded-sm border border-gray-300"
                style={{ backgroundColor: currentFormat.color || '#ffffff' }}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenuLabel>Cor do Texto</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="grid grid-cols-5 gap-1 p-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onColor(color.value)}
                  className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 ${
                    currentFormat.color === color.value
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
