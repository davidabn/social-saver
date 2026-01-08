// Catálogo de fontes disponíveis para o carrossel

export interface FontDefinition {
  name: string           // Nome da fonte (exibido no dropdown)
  family: string         // CSS font-family completo
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace'
  weights: number[]      // Pesos disponíveis (400, 500, 600, 700, etc)
  styles: ('normal' | 'italic')[]
  source: 'google' | 'system'
}

// Mapeamento de peso numérico para nome legível
export const weightNames: Record<number, string> = {
  100: 'Thin',
  200: 'Extra Light',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'Semi Bold',
  700: 'Bold',
  800: 'Extra Bold',
  900: 'Black'
}

// Fontes do Sistema (funcionam offline)
export const systemFonts: FontDefinition[] = [
  {
    name: 'Arial',
    family: 'Arial, sans-serif',
    category: 'sans-serif',
    weights: [400, 700],
    styles: ['normal', 'italic'],
    source: 'system'
  },
  {
    name: 'Georgia',
    family: 'Georgia, serif',
    category: 'serif',
    weights: [400, 700],
    styles: ['normal', 'italic'],
    source: 'system'
  },
  {
    name: 'Times New Roman',
    family: '"Times New Roman", Times, serif',
    category: 'serif',
    weights: [400, 700],
    styles: ['normal', 'italic'],
    source: 'system'
  },
  {
    name: 'Verdana',
    family: 'Verdana, sans-serif',
    category: 'sans-serif',
    weights: [400, 700],
    styles: ['normal', 'italic'],
    source: 'system'
  },
  {
    name: 'Impact',
    family: 'Impact, Haettenschweiler, sans-serif',
    category: 'display',
    weights: [400],
    styles: ['normal'],
    source: 'system'
  },
  {
    name: 'Trebuchet MS',
    family: '"Trebuchet MS", sans-serif',
    category: 'sans-serif',
    weights: [400, 700],
    styles: ['normal', 'italic'],
    source: 'system'
  },
  {
    name: 'Courier New',
    family: '"Courier New", monospace',
    category: 'monospace',
    weights: [400, 700],
    styles: ['normal', 'italic'],
    source: 'system'
  }
]

// Google Fonts (populares para design social media)
export const googleFonts: FontDefinition[] = [
  // Sans-serif modernas
  {
    name: 'Montserrat',
    family: '"Montserrat", sans-serif',
    category: 'sans-serif',
    weights: [400, 500, 600, 700, 800, 900],
    styles: ['normal', 'italic'],
    source: 'google'
  },
  {
    name: 'Poppins',
    family: '"Poppins", sans-serif',
    category: 'sans-serif',
    weights: [400, 500, 600, 700, 800, 900],
    styles: ['normal', 'italic'],
    source: 'google'
  },
  {
    name: 'Roboto',
    family: '"Roboto", sans-serif',
    category: 'sans-serif',
    weights: [400, 500, 700, 900],
    styles: ['normal', 'italic'],
    source: 'google'
  },
  {
    name: 'Open Sans',
    family: '"Open Sans", sans-serif',
    category: 'sans-serif',
    weights: [400, 500, 600, 700, 800],
    styles: ['normal', 'italic'],
    source: 'google'
  },
  {
    name: 'Lato',
    family: '"Lato", sans-serif',
    category: 'sans-serif',
    weights: [400, 700, 900],
    styles: ['normal', 'italic'],
    source: 'google'
  },
  {
    name: 'Raleway',
    family: '"Raleway", sans-serif',
    category: 'sans-serif',
    weights: [400, 500, 600, 700, 800, 900],
    styles: ['normal', 'italic'],
    source: 'google'
  },
  {
    name: 'Inter',
    family: '"Inter", sans-serif',
    category: 'sans-serif',
    weights: [400, 500, 600, 700, 800, 900],
    styles: ['normal'],
    source: 'google'
  },
  {
    name: 'Nunito',
    family: '"Nunito", sans-serif',
    category: 'sans-serif',
    weights: [400, 500, 600, 700, 800, 900],
    styles: ['normal', 'italic'],
    source: 'google'
  },

  // Serif elegantes
  {
    name: 'Playfair Display',
    family: '"Playfair Display", serif',
    category: 'serif',
    weights: [400, 500, 600, 700, 800, 900],
    styles: ['normal', 'italic'],
    source: 'google'
  },
  {
    name: 'Merriweather',
    family: '"Merriweather", serif',
    category: 'serif',
    weights: [400, 700, 900],
    styles: ['normal', 'italic'],
    source: 'google'
  },
  {
    name: 'Lora',
    family: '"Lora", serif',
    category: 'serif',
    weights: [400, 500, 600, 700],
    styles: ['normal', 'italic'],
    source: 'google'
  },
  {
    name: 'Libre Baskerville',
    family: '"Libre Baskerville", serif',
    category: 'serif',
    weights: [400, 700],
    styles: ['normal', 'italic'],
    source: 'google'
  },

  // Display / Headlines impactantes
  {
    name: 'Bebas Neue',
    family: '"Bebas Neue", sans-serif',
    category: 'display',
    weights: [400],
    styles: ['normal'],
    source: 'google'
  },
  {
    name: 'Anton',
    family: '"Anton", sans-serif',
    category: 'display',
    weights: [400],
    styles: ['normal'],
    source: 'google'
  },
  {
    name: 'Oswald',
    family: '"Oswald", sans-serif',
    category: 'display',
    weights: [400, 500, 600, 700],
    styles: ['normal'],
    source: 'google'
  },
  {
    name: 'Archivo Black',
    family: '"Archivo Black", sans-serif',
    category: 'display',
    weights: [400],
    styles: ['normal'],
    source: 'google'
  },
  {
    name: 'Righteous',
    family: '"Righteous", sans-serif',
    category: 'display',
    weights: [400],
    styles: ['normal'],
    source: 'google'
  },

  // Handwriting / Script
  {
    name: 'Dancing Script',
    family: '"Dancing Script", cursive',
    category: 'handwriting',
    weights: [400, 500, 600, 700],
    styles: ['normal'],
    source: 'google'
  },
  {
    name: 'Pacifico',
    family: '"Pacifico", cursive',
    category: 'handwriting',
    weights: [400],
    styles: ['normal'],
    source: 'google'
  },
  {
    name: 'Caveat',
    family: '"Caveat", cursive',
    category: 'handwriting',
    weights: [400, 500, 600, 700],
    styles: ['normal'],
    source: 'google'
  }
]

// Todas as fontes combinadas
export const allFonts: FontDefinition[] = [...systemFonts, ...googleFonts]

// Fontes agrupadas por categoria
export const fontsByCategory = {
  'sans-serif': allFonts.filter(f => f.category === 'sans-serif'),
  'serif': allFonts.filter(f => f.category === 'serif'),
  'display': allFonts.filter(f => f.category === 'display'),
  'handwriting': allFonts.filter(f => f.category === 'handwriting'),
  'monospace': allFonts.filter(f => f.category === 'monospace')
}

// Nomes das categorias em português
export const categoryNames: Record<string, string> = {
  'sans-serif': 'Sans Serif',
  'serif': 'Serif',
  'display': 'Display / Headlines',
  'handwriting': 'Manuscrita',
  'monospace': 'Monoespaçada'
}

// Busca uma fonte pelo nome
export function getFontByName(name: string): FontDefinition | undefined {
  return allFonts.find(f => f.name === name)
}

// Retorna o CSS font-family para uma fonte
export function getFontFamily(name: string): string {
  const font = getFontByName(name)
  return font?.family || name
}

// Gera a URL do Google Fonts para carregar uma fonte
export function getGoogleFontUrl(fontName: string, weights?: number[]): string {
  const font = getFontByName(fontName)
  if (!font || font.source !== 'google') return ''

  const weightsToLoad = weights || font.weights
  const hasItalic = font.styles.includes('italic')

  // Formato: family=Montserrat:ital,wght@0,400;0,700;1,400;1,700
  let weightParams: string[] = []

  weightsToLoad.forEach(w => {
    weightParams.push(`0,${w}`) // normal
    if (hasItalic) {
      weightParams.push(`1,${w}`) // italic
    }
  })

  const familyParam = hasItalic
    ? `${fontName.replace(/ /g, '+')}:ital,wght@${weightParams.join(';')}`
    : `${fontName.replace(/ /g, '+')}:wght@${weightsToLoad.join(';')}`

  return `https://fonts.googleapis.com/css2?family=${familyParam}&display=swap`
}
