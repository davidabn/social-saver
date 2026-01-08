import type { CarouselTemplate } from '@/types/template'

export const defaultTemplate: CarouselTemplate = {
  id: 'default',
  name: 'Template Padrão',
  description: 'Estilo clássico e limpo. Totalmente editável.',
  thumbnail: '', 

  palette: {
    primary: '#000000',
    secondary: '#333333',
    background: '#000000',
    backgroundAlt: '#1a1a1a',
    text: '#FFFFFF',
    textAlt: '#CCCCCC',
    accent: '#FFFFFF'
  },

  typography: {
    headlineFont: 'Georgia, serif',
    headlineSize: 72,
    headlineWeight: 'bold',
    headlineStyle: 'normal',
    
    headlineAltFont: 'Georgia, serif',
    headlineAltSize: 72,
    headlineAltWeight: 'bold',

    bodyFont: '-apple-system, BlinkMacSystemFont, sans-serif',
    bodySize: 36,
    bodyWeight: 'normal',
    
    headerFont: 'Georgia, serif',
    headerSize: 42
  },

  header: {
    enabled: true,
    height: 10,
    defaultLeft: '',
    defaultCenter: '',
    defaultRight: '',
    textColor: '#FFFFFF'
  },

  decorations: {
    underlineHeadline: false,
    underlineColor: '#000000',
    underlineThickness: 0,
    separatorLine: false,
    separatorColor: '#000000',
    separatorThickness: 0
  },

  layouts: {
    cover: {
      type: 'cover',
      name: 'Capa',
      description: 'Capa padrão',
      backgroundColor: '#000000',
      headlineColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      imageArea: { x: 0, y: 0, width: 100, height: 100, align: 'center' },
      headlineArea: { x: 4, y: 79, width: 92, align: 'left' },
      bodyArea: { x: 4, y: 88, width: 92, align: 'left' },
      gradientOverlay: { enabled: true, direction: 'bottom', startOpacity: 0, endOpacity: 0.8, color: '#000000' }
    },
    
    imageTop: {
      type: 'imageTop',
      name: 'Imagem Topo',
      description: 'Imagem no topo',
      backgroundColor: '#000000',
      headlineColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      imageArea: { x: 0, y: 0, width: 100, height: 50, align: 'center' },
      headlineArea: { x: 4, y: 55, width: 92, align: 'left' },
      bodyArea: { x: 4, y: 75, width: 92, align: 'left' },
      gradientOverlay: { enabled: false, direction: 'bottom', startOpacity: 0, endOpacity: 0, color: '#000000' }
    },
    
    textOnly: {
      type: 'textOnly',
      name: 'Apenas Texto',
      description: 'Texto centralizado',
      backgroundColor: '#000000',
      headlineColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      imageArea: null,
      headlineArea: { x: 50, y: 40, width: 90, align: 'center' },
      bodyArea: { x: 50, y: 65, width: 90, align: 'center' },
      gradientOverlay: { enabled: false, direction: 'bottom', startOpacity: 0, endOpacity: 0, color: '#000000' }
    },

    fullImage: {
        type: 'fullImage',
        name: 'Imagem Completa',
        description: '',
        backgroundColor: '#000000',
        headlineColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        imageArea: { x: 0, y: 0, width: 100, height: 100, align: 'center' },
        headlineArea: { x: 50, y: 50, width: 90, align: 'center' },
        bodyArea: { x: 50, y: 70, width: 90, align: 'center' },
        gradientOverlay: { enabled: false, direction: 'bottom', startOpacity: 0, endOpacity: 0, color: '#000000' }
    },

    textTop: {
        type: 'textTop',
        name: 'Texto Topo',
        description: '',
        backgroundColor: '#000000',
        headlineColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        imageArea: { x: 0, y: 40, width: 100, height: 60, align: 'center' },
        headlineArea: { x: 4, y: 10, width: 92, align: 'left' },
        bodyArea: { x: 4, y: 80, width: 92, align: 'left' },
        gradientOverlay: { enabled: false, direction: 'bottom', startOpacity: 0, endOpacity: 0, color: '#000000' }
    },

    textImageText: {
        type: 'textImageText',
        name: 'Texto Imagem Texto',
        description: '',
        backgroundColor: '#000000',
        headlineColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        imageArea: { x: 0, y: 30, width: 100, height: 40, align: 'center' },
        headlineArea: { x: 4, y: 10, width: 92, align: 'left' },
        bodyArea: { x: 4, y: 80, width: 92, align: 'left' },
        gradientOverlay: { enabled: false, direction: 'bottom', startOpacity: 0, endOpacity: 0, color: '#000000' }
    },

    imageBottom: {
        type: 'imageBottom',
        name: 'Imagem Baixo',
        description: '',
        backgroundColor: '#000000',
        headlineColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        imageArea: { x: 0, y: 50, width: 100, height: 50, align: 'center' },
        headlineArea: { x: 4, y: 10, width: 92, align: 'left' },
        bodyArea: { x: 4, y: 30, width: 92, align: 'left' },
        gradientOverlay: { enabled: false, direction: 'bottom', startOpacity: 0, endOpacity: 0, color: '#000000' }
    },

    imageLeft: {
        type: 'imageLeft',
        name: 'Imagem Esquerda',
        description: '',
        backgroundColor: '#000000',
        headlineColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        imageArea: { x: 0, y: 0, width: 50, height: 100, align: 'center' },
        headlineArea: { x: 55, y: 10, width: 40, align: 'left' },
        bodyArea: { x: 55, y: 30, width: 40, align: 'left' },
        gradientOverlay: { enabled: false, direction: 'bottom', startOpacity: 0, endOpacity: 0, color: '#000000' }
    },

    imageRight: {
        type: 'imageRight',
        name: 'Imagem Direita',
        description: '',
        backgroundColor: '#000000',
        headlineColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        imageArea: { x: 50, y: 0, width: 50, height: 100, align: 'center' },
        headlineArea: { x: 5, y: 10, width: 40, align: 'left' },
        bodyArea: { x: 5, y: 30, width: 40, align: 'left' },
        gradientOverlay: { enabled: false, direction: 'bottom', startOpacity: 0, endOpacity: 0, color: '#000000' }
    }
  },

  defaultLayoutSequence: ['cover', 'imageTop', 'textOnly']
}