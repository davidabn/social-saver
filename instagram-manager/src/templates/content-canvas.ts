import type { CarouselTemplate } from '@/types/template'

export const contentCanvasTemplate: CarouselTemplate = {
  id: 'content-canvas',
  name: 'Content Canvas',
  description: 'Estilo profissional com headlines impactantes, cores vibrantes e layouts variados',
  thumbnail: '/templates/content-canvas-thumb.png',

  palette: {
    primary: '#D93500',        // Vermelho-laranja (headlines, destaques)
    secondary: '#FF6633',      // Laranja mais claro
    background: '#FFFACD',     // Fundo claro/amarelado (creme)
    backgroundAlt: '#3D2817',  // Fundo marrom escuro
    text: '#FFFFFF',           // Texto branco
    textAlt: '#3D2817',        // Texto marrom escuro
    accent: '#00E5FF'          // Acento ciano
  },

  typography: {
    // Headline principal (italic serif) - para cover, textTop, textOnly
    headlineFont: 'Georgia, serif',
    headlineSize: 52,
    headlineWeight: 'normal',
    headlineStyle: 'italic',

    // Headline alternativo (bold condensed) - para imageTop, fullImage, textOnly
    headlineAltFont: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
    headlineAltSize: 80,   // Aumentado de 72 para 80
    headlineAltWeight: 'bold',

    // Body e Header
    bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    bodySize: 40,          // Aumentado de 30 para 40
    bodyWeight: 'normal',
    headerFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    headerSize: 12
  },

  header: {
    enabled: true,
    height: 40,                  // Mais baixo
    defaultLeft: 'ESTUDO DE CASO',
    defaultCenter: 'CONTENT CANVAS',
    defaultRight: '© COPYRIGHT 2025',
    textColor: '#FFFFFF'
  },

  decorations: {
    underlineHeadline: true,
    underlineColor: '#D93500',
    underlineThickness: 3,
    separatorLine: true,
    separatorColor: '#FFFFFF',
    separatorThickness: 2
  },

  layouts: {
    // Cover: Imagem fullscreen com texto sobreposto na parte inferior
    cover: {
      type: 'cover',
      name: 'Capa',
      description: 'Imagem em tela cheia com texto sobreposto',
      backgroundColor: '#000000',
      headlineColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      imageArea: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        align: 'center'
      },
      headlineArea: {
        x: 4,
        y: 78,  // Bem embaixo, próximo ao fim do slide
        width: 92,
        align: 'left'
      },
      bodyArea: {
        x: 4,
        y: 75,  // Posição base (será calculada dinamicamente no renderer)
        width: 92,
        align: 'left'
      },
      gradientOverlay: {
        enabled: true,
        direction: 'bottom',
        startOpacity: 0,
        endOpacity: 0.85,
        color: '#000000'
      }
    },

    // ImageTop: Imagem no topo (60%) + texto embaixo
    imageTop: {
      type: 'imageTop',
      name: 'Imagem no Topo',
      description: 'Imagem grande no topo com texto abaixo',
      backgroundColor: '#FF6633',
      headlineColor: '#3D2817',
      bodyColor: '#FFFFFF',
      useAltHeadline: true,  // Usa fonte BOLD CONDENSED UPPERCASE
      imageArea: {
        x: 0,
        y: 4,
        width: 100,
        height: 42,  // Reduzido para evitar sobreposição com headline
        align: 'center'
      },
      headlineArea: {
        x: 4,
        y: 62,  // Será recalculado no renderizador
        width: 92,
        align: 'left'
      },
      bodyArea: {
        x: 4,
        y: 78,  // Será recalculado no renderizador
        width: 92,
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

    // TextTop: Headline no topo + imagem + body
    textTop: {
      type: 'textTop',
      name: 'Texto no Topo',
      description: 'Headline destacado no topo com imagem abaixo',
      backgroundColor: '#FFFACD',
      headlineColor: '#D93500',
      bodyColor: '#FFFFFF',
      imageArea: {
        x: 0,
        y: 35,
        width: 100,
        height: 65,
        align: 'center'
      },
      headlineArea: {
        x: 4,
        y: 8,
        width: 92,
        align: 'left'
      },
      bodyArea: {
        x: 4,
        y: 78,  // Subido de 88 para 78 - mais espaço para o texto
        width: 92,
        align: 'left'
      },
      gradientOverlay: {
        enabled: true,
        direction: 'bottom',
        startOpacity: 0,
        endOpacity: 0.8,
        color: '#000000'
      }
    },

    // FullImage: Imagem fullscreen com texto central sobreposto
    fullImage: {
      type: 'fullImage',
      name: 'Imagem Completa',
      description: 'Imagem em tela cheia com texto centralizado',
      backgroundColor: '#000000',
      headlineColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      useAltHeadline: true,  // Usa fonte BOLD CONDENSED UPPERCASE
      imageArea: {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        align: 'center'
      },
      headlineArea: {
        x: 4,
        y: 35,
        width: 92,
        align: 'left'
      },
      bodyArea: {
        x: 4,
        y: 65,
        width: 92,
        align: 'left'
      },
      gradientOverlay: {
        enabled: true,
        direction: 'full',
        startOpacity: 0.4,
        endOpacity: 0.7,
        color: '#000000'
      }
    },

    // TextOnly: Apenas texto (sem imagem) - CENTRALIZADO
    textOnly: {
      type: 'textOnly',
      name: 'Apenas Texto',
      description: 'Foco no texto sem imagem de fundo',
      backgroundColor: '#000000',
      headlineColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      useAltHeadline: true,  // Usa fonte BOLD CONDENSED UPPERCASE
      imageArea: null,
      headlineArea: {
        x: 50,           // Centro horizontal
        y: 38,           // Centralizado verticalmente
        width: 90,
        align: 'center'  // CENTRALIZADO
      },
      bodyArea: {
        x: 50,           // Centro horizontal
        y: 65,
        width: 85,
        align: 'center'  // CENTRALIZADO
      },
      gradientOverlay: {
        enabled: false,
        direction: 'bottom',
        startOpacity: 0,
        endOpacity: 0,
        color: '#000000'
      }
    },

    // TextImageText: Headline no topo + imagem no meio + body embaixo (sanduíche)
    textImageText: {
      type: 'textImageText',
      name: 'Texto + Imagem + Texto',
      description: 'Headline no topo, imagem no meio, body embaixo',
      backgroundColor: '#E85A2C',
      headlineColor: '#FFFFFF',
      bodyColor: '#1A1A1A',
      imageArea: {
        x: 4,
        y: 28,
        width: 92,
        height: 40,
        align: 'center'
      },
      headlineArea: {
        x: 4,
        y: 6,
        width: 92,
        align: 'left'
      },
      bodyArea: {
        x: 4,
        y: 72,
        width: 92,
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

    // ImageBottom: Texto no topo + imagem na parte inferior (com bordas arredondadas)
    imageBottom: {
      type: 'imageBottom',
      name: 'Imagem Embaixo',
      description: 'Texto no topo com imagem na parte inferior',
      backgroundColor: '#3D2817',  // Fundo escuro
      headlineColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      useAltHeadline: false,  // Usa Georgia itálico (não condensed)
      imageArea: {
        x: 0,
        y: 55,
        width: 100,
        height: 40,
        align: 'center'
      },
      headlineArea: {
        x: 4,
        y: 8,
        width: 92,
        align: 'left'
      },
      bodyArea: {
        x: 4,
        y: 25,  // Será recalculado dinamicamente após o headline
        width: 92,
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

    // ImageLeft: Imagem na esquerda (40%) + texto na direita (60%)
    imageLeft: {
      type: 'imageLeft',
      name: 'Imagem à Esquerda',
      description: 'Imagem na esquerda com texto na direita',
      backgroundColor: '#000000',
      headlineColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      useAltHeadline: false,
      imageArea: {
        x: 0,
        y: 0,
        width: 40,
        height: 100,
        align: 'center'
      },
      headlineArea: {
        x: 44,  // 40% + 4% margem
        y: 8,
        width: 52,  // 60% - 8% margens
        align: 'left'
      },
      bodyArea: {
        x: 44,
        y: 30,  // Será recalculado dinamicamente após o headline
        width: 52,
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

    // ImageRight: Texto na esquerda (60%) + imagem na direita (40%)
    imageRight: {
      type: 'imageRight',
      name: 'Imagem à Direita',
      description: 'Imagem na direita com texto na esquerda',
      backgroundColor: '#000000',
      headlineColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      useAltHeadline: false,
      imageArea: {
        x: 60,  // Começa em 60%
        y: 0,
        width: 40,
        height: 100,
        align: 'center'
      },
      headlineArea: {
        x: 4,
        y: 8,
        width: 52,  // 60% - 8% margens
        align: 'left'
      },
      bodyArea: {
        x: 4,
        y: 30,  // Será recalculado dinamicamente após o headline
        width: 52,
        align: 'left'
      },
      gradientOverlay: {
        enabled: false,
        direction: 'bottom',
        startOpacity: 0,
        endOpacity: 0,
        color: '#000000'
      }
    }
  },

  // Todos os layouts disponíveis neste template
  defaultLayoutSequence: [
    'cover',
    'imageTop',
    'textTop',
    'fullImage',
    'textOnly',
    'textImageText',
    'imageBottom',
    'imageLeft',
    'imageRight'
  ]
}
