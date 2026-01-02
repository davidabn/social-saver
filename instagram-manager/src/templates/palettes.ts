// Paletas de cores para customização de templates

export interface ColorPalette {
  id: string
  name: string
  background: string      // Cor de fundo principal (layouts claros)
  backgroundAlt: string   // Cor de fundo alternativo (layouts escuros)
  headline: string        // Cor do título (fundos claros)
  headlineAlt: string     // Cor do título (fundos escuros)
  body: string            // Cor do texto (fundos claros)
  bodyAlt: string         // Cor do texto (fundos escuros)
  accent: string          // Cor de destaque (underline, separador)
}

export const PRESET_PALETTES: ColorPalette[] = [
  {
    id: 'original',
    name: 'Original',
    background: '#FF6633',
    backgroundAlt: '#3D2817',
    headline: '#FFFFFF',
    headlineAlt: '#FFFFFF',
    body: '#FFFFFF',
    bodyAlt: '#FFFFFF',
    accent: '#D93500'
  },
  {
    id: 'ocean',
    name: 'Oceano',
    background: '#0EA5E9',
    backgroundAlt: '#0C4A6E',
    headline: '#FFFFFF',
    headlineAlt: '#FFFFFF',
    body: '#FFFFFF',
    bodyAlt: '#FFFFFF',
    accent: '#38BDF8'
  },
  {
    id: 'forest',
    name: 'Floresta',
    background: '#22C55E',
    backgroundAlt: '#14532D',
    headline: '#FFFFFF',
    headlineAlt: '#FFFFFF',
    body: '#FFFFFF',
    bodyAlt: '#FFFFFF',
    accent: '#4ADE80'
  },
  {
    id: 'sunset',
    name: 'Pôr do Sol',
    background: '#F97316',
    backgroundAlt: '#7C2D12',
    headline: '#FFFFFF',
    headlineAlt: '#FFFFFF',
    body: '#FFFFFF',
    bodyAlt: '#FFFFFF',
    accent: '#FB923C'
  },
  {
    id: 'royal',
    name: 'Realeza',
    background: '#8B5CF6',
    backgroundAlt: '#3B0764',
    headline: '#FFFFFF',
    headlineAlt: '#FFFFFF',
    body: '#FFFFFF',
    bodyAlt: '#FFFFFF',
    accent: '#A78BFA'
  },
  {
    id: 'rose',
    name: 'Rosa',
    background: '#EC4899',
    backgroundAlt: '#701A3D',
    headline: '#FFFFFF',
    headlineAlt: '#FFFFFF',
    body: '#FFFFFF',
    bodyAlt: '#FFFFFF',
    accent: '#F472B6'
  },
  {
    id: 'monochrome',
    name: 'Monocromático',
    background: '#525252',
    backgroundAlt: '#171717',
    headline: '#FFFFFF',
    headlineAlt: '#FFFFFF',
    body: '#E5E5E5',
    bodyAlt: '#E5E5E5',
    accent: '#A3A3A3'
  },
  {
    id: 'cream',
    name: 'Creme',
    background: '#FEF3C7',
    backgroundAlt: '#78350F',
    headline: '#78350F',
    headlineAlt: '#FFFFFF',
    body: '#92400E',
    bodyAlt: '#FFFFFF',
    accent: '#D97706'
  },
  {
    id: 'blackwhite',
    name: 'Preto e Branco',
    background: '#FFFFFF',
    backgroundAlt: '#000000',
    headline: '#000000',
    headlineAlt: '#FFFFFF',
    body: '#000000',
    bodyAlt: '#FFFFFF',
    accent: '#000000'
  }
]

// Paleta padrão (original do template)
export const DEFAULT_PALETTE = PRESET_PALETTES[0]

// Função para encontrar paleta por ID
export function getPaletteById(id: string): ColorPalette | undefined {
  return PRESET_PALETTES.find(p => p.id === id)
}
