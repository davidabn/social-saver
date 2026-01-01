import type { CarouselTemplate } from '@/types/template'

export const brandsDecodedTemplate: CarouselTemplate = {
  id: 'brands-decoded',
  name: 'Brands Decoded',
  description: 'Estilo profissional com headlines impactantes, cores vibrantes e layouts variados',
  thumbnail: '/templates/brands-decoded-thumb.png',

  palette: {
    primary: '#FF4500',        // Vermelho-laranja (headlines, destaques)
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

    // Headline alternativo (bold condensed) - para imageTop, fullImage
    headlineAltFont: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
    headlineAltSize: 72,
    headlineAltWeight: 'bold',

    // Body e Header
    bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    bodySize: 30,
    bodyWeight: 'normal',
    headerFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    headerSize: 12
  },

  header: {
    enabled: true,
    height: 40,                  // Mais baixo
    defaultLeft: 'ESTUDO DE CASO',
    defaultCenter: 'BRANDS DECODED',
    defaultRight: '© COPYRIGHT 2025',
    textColor: '#3D2817'
  },

  decorations: {
    underlineHeadline: true,
    underlineColor: '#FF4500',
    underlineThickness: 3,
    separatorLine: true,
    separatorColor: '#FF4500',
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
        y: 60,  // Parte inferior da tela, mas não tão baixo
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
      headlineColor: '#FF4500',
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
        y: 88,  // Parte inferior da imagem (sobre o gradient)
        width: 92,
        align: 'left'
      },
      gradientOverlay: {
        enabled: true,
        direction: 'bottom',
        startOpacity: 0,
        endOpacity: 0.8,
        color: '#3D2817'
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
      backgroundColor: '#3D2817',
      headlineColor: '#FF4500',
      bodyColor: '#FFFFFF',
      imageArea: null,
      headlineArea: {
        x: 50,           // Centro horizontal
        y: 30,           // Mais acima para dar espaço
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
    }
  },

  // Sequência sugerida de layouts para 10 slides
  defaultLayoutSequence: [
    'cover',      // Slide 1
    'imageTop',   // Slide 2
    'imageTop',   // Slide 3
    'textTop',    // Slide 4
    'fullImage',  // Slide 5
    'imageTop',   // Slide 6
    'textTop',    // Slide 7
    'textOnly',   // Slide 8
    'textTop',    // Slide 9
    'fullImage'   // Slide 10
  ]
}
