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
        }
    } as any,

    defaultLayoutSequence: ['cover']
}
