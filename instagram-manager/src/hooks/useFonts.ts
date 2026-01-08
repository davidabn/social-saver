import { useState, useCallback, useEffect } from 'react'
import { getFontByName, getGoogleFontUrl } from '@/templates/fonts'

interface UseFontsReturn {
  loadFont: (fontName: string) => void
  loadFonts: (fontNames: string[]) => void
  isLoaded: (fontName: string) => boolean
  loadedFonts: Set<string>
  isLoading: boolean
}

// Cache global para fontes já carregadas (persiste entre re-renders)
const globalLoadedFonts = new Set<string>()
const globalLoadingFonts = new Set<string>()

export function useFonts(): UseFontsReturn {
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set(globalLoadedFonts))
  const [isLoading, setIsLoading] = useState(false)

  // Sincroniza estado local com global
  useEffect(() => {
    setLoadedFonts(new Set(globalLoadedFonts))
  }, [])

  const loadFont = useCallback((fontName: string) => {
    // Já carregada ou carregando
    if (globalLoadedFonts.has(fontName) || globalLoadingFonts.has(fontName)) {
      return
    }

    const font = getFontByName(fontName)
    if (!font) {
      console.warn(`Font "${fontName}" not found in catalog`)
      return
    }

    // Fontes do sistema não precisam carregar
    if (font.source === 'system') {
      globalLoadedFonts.add(fontName)
      setLoadedFonts(new Set(globalLoadedFonts))
      return
    }

    // Carrega Google Font
    globalLoadingFonts.add(fontName)
    setIsLoading(true)

    const url = getGoogleFontUrl(fontName)
    if (!url) {
      globalLoadingFonts.delete(fontName)
      setIsLoading(false)
      return
    }

    // Cria elemento link
    const link = document.createElement('link')
    link.href = url
    link.rel = 'stylesheet'
    link.setAttribute('data-font', fontName)

    link.onload = () => {
      globalLoadingFonts.delete(fontName)
      globalLoadedFonts.add(fontName)
      setLoadedFonts(new Set(globalLoadedFonts))
      setIsLoading(globalLoadingFonts.size > 0)
    }

    link.onerror = () => {
      globalLoadingFonts.delete(fontName)
      setIsLoading(globalLoadingFonts.size > 0)
      console.error(`Failed to load font: ${fontName}`)
    }

    // Verifica se já existe um link para essa fonte
    const existingLink = document.querySelector(`link[data-font="${fontName}"]`)
    if (!existingLink) {
      document.head.appendChild(link)
    }
  }, [])

  const loadFonts = useCallback((fontNames: string[]) => {
    fontNames.forEach(loadFont)
  }, [loadFont])

  const isLoaded = useCallback((fontName: string) => {
    const font = getFontByName(fontName)
    // Fontes do sistema sempre disponíveis
    if (font?.source === 'system') return true
    return globalLoadedFonts.has(fontName)
  }, [])

  return {
    loadFont,
    loadFonts,
    isLoaded,
    loadedFonts,
    isLoading
  }
}

// Hook para pré-carregar fontes usadas nos slides
export function usePreloadSlideFonts(slides: Array<{
  customPositions?: {
    [key: string]: {
      headlineFontFamily?: string
      bodyFontFamily?: string
    }
  }
}>) {
  const { loadFont } = useFonts()

  useEffect(() => {
    const fontsToLoad = new Set<string>()

    slides.forEach(slide => {
      if (slide.customPositions) {
        Object.values(slide.customPositions).forEach(pos => {
          if (pos.headlineFontFamily) {
            fontsToLoad.add(pos.headlineFontFamily)
          }
          if (pos.bodyFontFamily) {
            fontsToLoad.add(pos.bodyFontFamily)
          }
        })
      }
    })

    fontsToLoad.forEach(loadFont)
  }, [slides, loadFont])
}

// Função para aguardar fonte carregar (útil para canvas rendering)
export async function waitForFont(fontFamily: string, timeout = 3000): Promise<boolean> {
  try {
    // Usa a Font Loading API se disponível
    if ('fonts' in document) {
      await Promise.race([
        document.fonts.load(`16px "${fontFamily}"`),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Font load timeout')), timeout)
        )
      ])
      return true
    }
    return true
  } catch {
    console.warn(`Font "${fontFamily}" may not have loaded properly`)
    return false
  }
}
