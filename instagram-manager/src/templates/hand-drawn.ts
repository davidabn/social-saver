import type { CarouselTemplate } from '@/types/template'

export const handDrawnTemplate: CarouselTemplate = {
  id: 'hand-drawn',
  name: 'Hand Drawn',
  description: 'Estilo minimalista com elementos desenhados à mão',
  thumbnail: '/templates/hand-drawn-thumb.png',

  palette: {
    primary: '#1A1A1A',        // Preto (headlines, elementos)
    secondary: '#1A1A1A',      // Preto
    background: '#F5A623',     // Amarelo/laranja quente
    backgroundAlt: '#F5A623',  // Mesmo fundo
    text: '#1A1A1A',           // Texto preto
    textAlt: '#1A1A1A',        // Texto preto
    accent: '#FF6B35'          // Laranja (para chamas/detalhes)
  },

  typography: {
    // Headline principal - fonte hand-drawn Caveat
    headlineFont: '"Caveat", cursive',
    headlineSize: 64,
    headlineWeight: 'bold',
    headlineStyle: 'normal',

    // Headline alternativo - mesma fonte
    headlineAltFont: '"Caveat", cursive',
    headlineAltSize: 64,
    headlineAltWeight: 'bold',

    // Body - mesma fonte manuscrita
    bodyFont: '"Caveat", cursive',
    bodySize: 40,
    bodyWeight: 'normal',
    bodyStyle: 'normal',

    // Header - fonte sistema
    headerFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    headerSize: 12
  },

  header: {
    enabled: true,
    height: 40,
    defaultLeft: 'DAVID FACUNDO',
    defaultCenter: 'DAVIDABN_',
    defaultRight: '© COPYRIGHT 2026',
    textColor: '#1A1A1A'
  },

  decorations: {
    underlineHeadline: false,
    underlineColor: '#1A1A1A',
    underlineThickness: 2,
    separatorLine: false,
    separatorColor: '#1A1A1A',
    separatorThickness: 2
  },

  layouts: {
    // Cover: Capa do carrossel
    cover: {
      type: 'cover',
      name: 'Capa',
      description: 'Imagem no topo com texto abaixo',
      backgroundColor: '#F5A623',
      headlineColor: '#1A1A1A',
      bodyColor: '#1A1A1A',
      imageArea: {
        x: 5,
        y: 8,
        width: 90,
        height: 50,
        align: 'center'
      },
      headlineArea: {
        x: 5,
        y: 68,
        width: 90,
        align: 'left'
      },
      bodyArea: {
        x: 5,
        y: 85,
        width: 90,
        align: 'left'
      },
      gradientOverlay: {
        enabled: false,
        direction: 'bottom',
        startOpacity: 0,
        endOpacity: 0,
        color: '#000000'
      }
    },

    // ImageTop: Imagem no topo + texto embaixo
    imageTop: {
      type: 'imageTop',
      name: 'Imagem no Topo',
      description: 'Imagem no topo com texto abaixo',
      backgroundColor: '#F5A623',
      headlineColor: '#1A1A1A',
      bodyColor: '#1A1A1A',
      useAltHeadline: false,
      imageArea: {
        x: 5,
        y: 8,
        width: 90,
        height: 50,
        align: 'center'
      },
      headlineArea: {
        x: 5,
        y: 68,
        width: 90,
        align: 'left'
      },
      bodyArea: {
        x: 5,
        y: 85,
        width: 90,
        align: 'left'
      },
      gradientOverlay: {
        enabled: false,
        direction: 'bottom',
        startOpacity: 0,
        endOpacity: 0,
        color: '#000000'
      }
    },

    // TextTop: Headline no topo + imagem embaixo
    textTop: {
      type: 'textTop',
      name: 'Texto no Topo',
      description: 'Headline no topo com imagem abaixo',
      backgroundColor: '#F5A623',
      headlineColor: '#1A1A1A',
      bodyColor: '#1A1A1A',
      imageArea: {
        x: 5,
        y: 35,
        width: 90,
        height: 55,
        align: 'center'
      },
      headlineArea: {
        x: 5,
        y: 12,
        width: 90,
        align: 'left'
      },
      bodyArea: {
        x: 5,
        y: 85,
        width: 90,
        align: 'left'
      },
      gradientOverlay: {
        enabled: false,
        direction: 'bottom',
        startOpacity: 0,
        endOpacity: 0,
        color: '#000000'
      }
    },

    // TextOnly: Apenas texto (sem imagem)
    textOnly: {
      type: 'textOnly',
      name: 'Apenas Texto',
      description: 'Foco no texto sem imagem',
      backgroundColor: '#F5A623',
      headlineColor: '#1A1A1A',
      bodyColor: '#1A1A1A',
      useAltHeadline: false,
      imageArea: null,
      headlineArea: {
        x: 50,
        y: 35,
        width: 90,
        align: 'center'
      },
      bodyArea: {
        x: 50,
        y: 60,
        width: 85,
        align: 'center'
      },
      gradientOverlay: {
        enabled: false,
        direction: 'bottom',
        startOpacity: 0,
        endOpacity: 0,
        color: '#000000'
      }
    },

    // TextImageText: Headline no topo + imagem no meio + body embaixo
    textImageText: {
      type: 'textImageText',
      name: 'Texto + Imagem + Texto',
      description: 'Headline no topo, imagem no meio, body embaixo',
      backgroundColor: '#F5A623',
      headlineColor: '#1A1A1A',
      bodyColor: '#1A1A1A',
      imageArea: {
        x: 5,
        y: 28,
        width: 90,
        height: 40,
        align: 'center'
      },
      headlineArea: {
        x: 5,
        y: 10,
        width: 90,
        align: 'left'
      },
      bodyArea: {
        x: 5,
        y: 75,
        width: 90,
        align: 'left'
      },
      gradientOverlay: {
        enabled: false,
        direction: 'bottom',
        startOpacity: 0,
        endOpacity: 0,
        color: '#000000'
      }
    },

    // Layouts não usados no Hand Drawn (requeridos pelo tipo)
    fullImage: {
      type: 'fullImage',
      name: 'Imagem Fullscreen',
      description: 'Não usado neste template',
      backgroundColor: '#F5A623',
      headlineColor: '#1A1A1A',
      bodyColor: '#1A1A1A',
      imageArea: { x: 0, y: 0, width: 100, height: 100, align: 'center' },
      headlineArea: { x: 5, y: 50, width: 90, align: 'center' },
      bodyArea: { x: 5, y: 70, width: 90, align: 'center' },
      gradientOverlay: { enabled: false, direction: 'bottom', startOpacity: 0, endOpacity: 0, color: '#000000' }
    },
    imageBottom: {
      type: 'imageBottom',
      name: 'Imagem Embaixo',
      description: 'Não usado neste template',
      backgroundColor: '#F5A623',
      headlineColor: '#1A1A1A',
      bodyColor: '#1A1A1A',
      imageArea: { x: 5, y: 50, width: 90, height: 45, align: 'center' },
      headlineArea: { x: 5, y: 15, width: 90, align: 'left' },
      bodyArea: { x: 5, y: 30, width: 90, align: 'left' },
      gradientOverlay: { enabled: false, direction: 'bottom', startOpacity: 0, endOpacity: 0, color: '#000000' }
    },
    imageLeft: {
      type: 'imageLeft',
      name: 'Imagem Esquerda',
      description: 'Não usado neste template',
      backgroundColor: '#F5A623',
      headlineColor: '#1A1A1A',
      bodyColor: '#1A1A1A',
      imageArea: { x: 0, y: 0, width: 40, height: 100, align: 'center' },
      headlineArea: { x: 45, y: 30, width: 50, align: 'left' },
      bodyArea: { x: 45, y: 50, width: 50, align: 'left' },
      gradientOverlay: { enabled: false, direction: 'bottom', startOpacity: 0, endOpacity: 0, color: '#000000' }
    },
    imageRight: {
      type: 'imageRight',
      name: 'Imagem Direita',
      description: 'Não usado neste template',
      backgroundColor: '#F5A623',
      headlineColor: '#1A1A1A',
      bodyColor: '#1A1A1A',
      imageArea: { x: 60, y: 0, width: 40, height: 100, align: 'center' },
      headlineArea: { x: 5, y: 30, width: 50, align: 'left' },
      bodyArea: { x: 5, y: 50, width: 50, align: 'left' },
      gradientOverlay: { enabled: false, direction: 'bottom', startOpacity: 0, endOpacity: 0, color: '#000000' }
    }
  },

  // Sequência de layouts para 5 slides
  defaultLayoutSequence: [
    'cover',        // Slide 1
    'imageTop',     // Slide 2
    'textTop',      // Slide 3
    'textImageText',// Slide 4
    'textOnly'      // Slide 5
  ]
}
