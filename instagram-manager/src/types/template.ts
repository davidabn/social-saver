// Tipos de layout disponíveis para slides
export type SlideLayoutType =
  | 'cover'        // Slide 1: fullscreen + badge
  | 'imageTop'     // Slides 2,3,6: imagem topo + texto
  | 'textTop'      // Slides 4,7,9: texto topo + imagem
  | 'fullImage'    // Slides 5,10: imagem fullscreen + texto central
  | 'textOnly'     // Slide 8: apenas texto

// Paleta de cores do template
export interface TemplateColorPalette {
  primary: string           // Cor principal (headlines, destaques)
  secondary: string         // Cor secundária
  background: string        // Cor de fundo principal
  backgroundAlt: string     // Cor de fundo alternativa
  text: string              // Cor do texto principal
  textAlt: string           // Cor do texto alternativo
  accent: string            // Cor de destaque/acento
}

// Configurações de tipografia
export interface TemplateTypography {
  // Headline principal (italic serif)
  headlineFont: string      // Fonte do headline
  headlineSize: number      // Tamanho em px
  headlineWeight: string    // Peso (bold, normal, etc)
  headlineStyle: string     // normal, italic

  // Headline alternativo (bold condensed) - para imageTop/fullImage
  headlineAltFont: string   // Fonte condensed (Impact, etc)
  headlineAltSize: number   // Tamanho em px
  headlineAltWeight: string // Peso (geralmente bold)

  // Body e Header
  bodyFont: string          // Fonte do body
  bodySize: number
  bodyWeight: string
  headerFont: string        // Fonte do header
  headerSize: number
}

// Configuração do header de 3 colunas
export interface TemplateHeader {
  enabled: boolean
  height: number            // Altura em px
  defaultLeft: string       // Texto padrão esquerda
  defaultCenter: string     // Texto padrão centro
  defaultRight: string      // Texto padrão direita
  textColor: string         // Cor do texto do header
}

// Elementos decorativos do template
export interface TemplateDecorations {
  underlineHeadline: boolean      // Sublinhado no headline
  underlineColor: string
  underlineThickness: number
  separatorLine: boolean          // Linha entre headline e body
  separatorColor: string
  separatorThickness: number
}

// Configuração de área (posição e tamanho em %)
export interface AreaConfig {
  x: number               // Posição X em % (0-100)
  y: number               // Posição Y em %
  width: number           // Largura em %
  height?: number         // Altura em % (opcional)
  align: 'left' | 'center' | 'right'
}

// Configuração do gradient overlay
export interface GradientOverlayConfig {
  enabled: boolean
  direction: 'top' | 'bottom' | 'full'
  startOpacity: number    // Opacidade no início (0-1)
  endOpacity: number      // Opacidade no final (0-1)
  color: string           // Cor do gradient (geralmente preto)
}

// Configuração completa de um layout
export interface SlideLayoutConfig {
  type: SlideLayoutType
  name: string                    // Nome legível do layout
  description: string             // Descrição do layout
  imageArea: AreaConfig | null    // null se não tiver imagem
  headlineArea: AreaConfig
  bodyArea: AreaConfig
  gradientOverlay: GradientOverlayConfig
  backgroundColor: string         // Cor de fundo para este layout
  headlineColor: string           // Cor do headline para este layout
  bodyColor: string               // Cor do body para este layout
  useAltHeadline?: boolean        // Se true, usa fonte bold condensed uppercase
}

// Definição completa de um template de carrossel
export interface CarouselTemplate {
  id: string
  name: string
  description: string
  thumbnail: string               // URL da imagem de preview
  palette: TemplateColorPalette
  typography: TemplateTypography
  header: TemplateHeader
  decorations: TemplateDecorations
  layouts: Record<SlideLayoutType, SlideLayoutConfig>
  defaultLayoutSequence: SlideLayoutType[]  // Sequência sugerida de layouts
}

// Props para textos do header (editáveis pelo usuário)
export interface HeaderTexts {
  left: string
  center: string
  right: string
}
