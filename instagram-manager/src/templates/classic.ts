import type { CarouselTemplate } from '@/types/template'

export const classicTemplate: CarouselTemplate = {
    id: 'classic',
    name: 'Classic',
    description: 'Estilo padrão original com fontes Georgia e branding minimalista',
    thumbnail: '', // URL do preview se houver

    palette: {
        primary: '#FFFFFF',        // Headlines brancos por padrão
        secondary: '#E5E5E5',
        background: '#000000',     // Fundo preto por padrão
        backgroundAlt: '#1A1A1A',
        text: '#FFFFFF',
        textAlt: '#CCCCCC',
        accent: '#FFFFFF'
    },

    typography: {
        // Headline principal (italic serif Georgia) - Estilo original
        headlineFont: 'Georgia, serif',
        headlineSize: 72,
        headlineWeight: 'bold',
        headlineStyle: 'normal', // No original era bold 72px Georgia

        // Headline alternativo
        headlineAltFont: 'Georgia, serif',
        headlineAltSize: 72,
        headlineAltWeight: 'bold',

        // Body e Header
        bodyFont: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        bodySize: 36,
        bodyWeight: 'normal',
        headerFont: 'Georgia, serif',
        headerSize: 42
    },

    header: {
        enabled: false, // Desativado para usar o branding manual original
        height: 80,
        defaultLeft: '',
        defaultCenter: '',
        defaultRight: '',
        textColor: '#FFFFFF'
    },

    decorations: {
        underlineHeadline: false,
        underlineColor: '#FFFFFF',
        underlineThickness: 2,
        separatorLine: false,
        separatorColor: '#FFFFFF',
        separatorThickness: 1
    },

    layouts: {
        cover: {
            type: 'cover',
            name: 'Capa Original',
            description: 'Design clássico com branding no topo e texto embaixo',
            backgroundColor: '#000000',
            headlineColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
            imageArea: { x: 0, y: 0, width: 100, height: 100, align: 'center' },
            headlineArea: { x: 4, y: 74, width: 92, align: 'left' },
            bodyArea: { x: 4, y: 84, width: 92, align: 'left' },
            gradientOverlay: { enabled: true, direction: 'bottom', startOpacity: 0, endOpacity: 0.8, color: '#000000' }
        },
        imageTop: {
            type: 'imageTop',
            name: 'Imagem no Topo',
            description: 'Imagem no topo com texto abaixo',
            backgroundColor: '#000000',
            headlineColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
            imageArea: { x: 0, y: 4, width: 100, height: 42, align: 'center' },
            headlineArea: { x: 4, y: 62, width: 92, align: 'left' },
            bodyArea: { x: 4, y: 78, width: 92, align: 'left' },
            gradientOverlay: { enabled: false, direction: 'bottom', startOpacity: 0, endOpacity: 0, color: '#000000' }
        },
        textTop: {
            type: 'textTop',
            name: 'Texto no Topo',
            description: 'Headline no topo com imagem abaixo',
            backgroundColor: '#000000',
            headlineColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
            imageArea: { x: 0, y: 35, width: 100, height: 65, align: 'center' },
            headlineArea: { x: 4, y: 10, width: 92, align: 'left' },
            bodyArea: { x: 4, y: 85, width: 92, align: 'left' },
            gradientOverlay: { enabled: true, direction: 'bottom', startOpacity: 0, endOpacity: 0.8, color: '#000000' }
        },
        fullImage: {
            type: 'fullImage',
            name: 'Imagem Completa',
            description: 'Imagem cheia com texto centralizado',
            backgroundColor: '#000000',
            headlineColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
            imageArea: { x: 0, y: 0, width: 100, height: 100, align: 'center' },
            headlineArea: { x: 4, y: 40, width: 92, align: 'center' },
            bodyArea: { x: 4, y: 60, width: 92, align: 'center' },
            gradientOverlay: { enabled: true, direction: 'full', startOpacity: 0.4, endOpacity: 0.7, color: '#000000' }
        },
        textOnly: {
            type: 'textOnly',
            name: 'Apenas Texto',
            description: 'Foco total na mensagem',
            backgroundColor: '#000000',
            headlineColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
            imageArea: null,
            headlineArea: { x: 50, y: 38, width: 90, align: 'center' },
            bodyArea: { x: 50, y: 65, width: 85, align: 'center' },
            gradientOverlay: { enabled: false, direction: 'bottom', startOpacity: 0, endOpacity: 0, color: '#000000' }
        },
        textImageText: {
            type: 'textImageText',
            name: 'Misto',
            description: 'Headline, imagem e body intercalados',
            backgroundColor: '#000000',
            headlineColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
            imageArea: { x: 4, y: 28, width: 92, height: 40, align: 'center' },
            headlineArea: { x: 4, y: 6, width: 92, align: 'left' },
            bodyArea: { x: 4, y: 72, width: 92, align: 'left' },
            gradientOverlay: { enabled: false, direction: 'bottom', startOpacity: 0, endOpacity: 0, color: '#000000' }
        },
        imageBottom: {
            type: 'imageBottom',
            name: 'Imagem Inferior',
            description: 'Texto no topo com imagem embaixo',
            backgroundColor: '#000000',
            headlineColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
            imageArea: { x: 0, y: 55, width: 100, height: 40, align: 'center' },
            headlineArea: { x: 4, y: 10, width: 92, align: 'left' },
            bodyArea: { x: 4, y: 25, width: 92, align: 'left' },
            gradientOverlay: { enabled: false, direction: 'bottom', startOpacity: 0, endOpacity: 0, color: '#000000' }
        },
        imageLeft: {
            type: 'imageLeft',
            name: 'Lado a Lado (Esquerda)',
            description: 'Imagem na esquerda e texto na direita',
            backgroundColor: '#000000',
            headlineColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
            imageArea: { x: 0, y: 0, width: 40, height: 100, align: 'center' },
            headlineArea: { x: 44, y: 10, width: 52, align: 'left' },
            bodyArea: { x: 44, y: 30, width: 52, align: 'left' },
            gradientOverlay: { enabled: false, direction: 'bottom', startOpacity: 0, endOpacity: 0, color: '#000000' }
        },
        imageRight: {
            type: 'imageRight',
            name: 'Lado a Lado (Direita)',
            description: 'Texto na esquerda e imagem na direita',
            backgroundColor: '#000000',
            headlineColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
            imageArea: { x: 60, y: 0, width: 40, height: 100, align: 'center' },
            headlineArea: { x: 4, y: 10, width: 52, align: 'left' },
            bodyArea: { x: 4, y: 30, width: 52, align: 'left' },
            gradientOverlay: { enabled: false, direction: 'bottom', startOpacity: 0, endOpacity: 0, color: '#000000' }
        }
    },

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
