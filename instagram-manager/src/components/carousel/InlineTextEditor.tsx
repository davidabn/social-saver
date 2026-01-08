import { useState, useRef, useEffect, useCallback } from 'react'
import { TextFormatToolbar } from './TextFormatToolbar'
import { PREVIEW_SCALE } from '@/types/carousel'

interface InlineTextEditorProps {
  value: string
  onChange: (value: string) => void
  position: {
    x: number
    y: number
    width: number
    height: number
  }
  style: {
    fontSize: number
    fontFamily: string
    fontWeight: number | string
    fontStyle: 'normal' | 'italic'
    color: string
    textAlign: 'left' | 'center' | 'right'
    lineHeight: number
  }
  canvasRect: DOMRect
  onClose: () => void
}

export function InlineTextEditor({
  value,
  onChange,
  position,
  style,
  canvasRect,
  onClose
}: InlineTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 })
  const [currentFormat, setCurrentFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
    font: style.fontFamily,
    color: style.color
  })

  // Calcular posição do editor baseado na escala do preview
  const scaledPosition = {
    left: canvasRect.left + (position.x * PREVIEW_SCALE),
    top: canvasRect.top + (position.y * PREVIEW_SCALE),
    width: position.width * PREVIEW_SCALE,
    height: position.height * PREVIEW_SCALE
  }

  // Escalar fonte para o preview
  const scaledFontSize = style.fontSize * PREVIEW_SCALE

  // Focar no editor ao montar
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus()
      // Selecionar todo o texto
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(editorRef.current)
      selection?.removeAllRanges()
      selection?.addRange(range)
    }
  }, [])

  // Detectar formatação da seleção atual
  const detectCurrentFormat = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    // Detectar fonte e cor do elemento pai da seleção
    let font = style.fontFamily
    let color = style.color

    const anchorNode = selection.anchorNode
    if (anchorNode) {
      const parentElement = anchorNode.nodeType === Node.TEXT_NODE
        ? anchorNode.parentElement
        : anchorNode as HTMLElement

      if (parentElement) {
        const computedStyle = window.getComputedStyle(parentElement)
        font = computedStyle.fontFamily.split(',')[0].replace(/['"]/g, '') || style.fontFamily
        color = rgbToHex(computedStyle.color) || style.color
      }
    }

    setCurrentFormat({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      font,
      color
    })
  }, [style.fontFamily, style.color])

  // Detectar seleção de texto
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      setShowToolbar(false)
      return
    }

    const selectedText = selection.toString()
    if (selectedText.length > 0 && editorRef.current?.contains(selection.anchorNode)) {
      // Posicionar toolbar acima da seleção
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setToolbarPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      })
      setShowToolbar(true)
      detectCurrentFormat()
    } else {
      setShowToolbar(false)
    }
  }, [detectCurrentFormat])

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [handleSelectionChange])

  // Handlers de formatação
  const handleBold = () => {
    document.execCommand('bold', false)
    editorRef.current?.focus()
    detectCurrentFormat()
  }

  const handleItalic = () => {
    document.execCommand('italic', false)
    editorRef.current?.focus()
    detectCurrentFormat()
  }

  const handleUnderline = () => {
    document.execCommand('underline', false)
    editorRef.current?.focus()
    detectCurrentFormat()
  }

  const handleFont = (fontName: string) => {
    document.execCommand('fontName', false, fontName)
    editorRef.current?.focus()
    setCurrentFormat(prev => ({ ...prev, font: fontName }))
  }

  const handleColor = (color: string) => {
    document.execCommand('foreColor', false, color)
    editorRef.current?.focus()
    setCurrentFormat(prev => ({ ...prev, color }))
  }

  // Salvar HTML ao fechar
  const saveAndClose = useCallback(() => {
    if (editorRef.current) {
      // Salvar o HTML com formatação
      const htmlContent = editorRef.current.innerHTML
      onChange(htmlContent)
    }
    onClose()
  }, [onChange, onClose])

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
        // Verificar se clicou na toolbar ou em seus dropdowns
        const toolbar = document.getElementById('text-format-toolbar')
        const dropdownContent = document.querySelector('[data-radix-popper-content-wrapper]')

        if (toolbar && toolbar.contains(e.target as Node)) {
          return
        }
        if (dropdownContent && dropdownContent.contains(e.target as Node)) {
          return
        }

        saveAndClose()
      }
    }

    // Delay para não fechar imediatamente
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [saveAndClose])

  // Salvar ao pressionar Escape ou Enter (sem shift)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      saveAndClose()
    }
    // Enter sem Shift fecha
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveAndClose()
    }
  }

  // Converter valor para HTML se necessário
  const initialHtml = value.includes('<') ? value : value.replace(/\n/g, '<br>')

  return (
    <>
      {/* Editor inline posicionado sobre o canvas */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        style={{
          position: 'fixed',
          left: scaledPosition.left,
          top: scaledPosition.top,
          width: scaledPosition.width,
          minHeight: scaledPosition.height,
          fontSize: scaledFontSize,
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
          fontStyle: style.fontStyle,
          color: style.color,
          textAlign: style.textAlign,
          lineHeight: style.lineHeight,
          padding: '4px 8px',
          outline: '2px solid #3b82f6',
          borderRadius: '4px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          cursor: 'text',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflow: 'hidden'
        }}
        dangerouslySetInnerHTML={{ __html: initialHtml }}
      />

      {/* Toolbar de formatação */}
      {showToolbar && (
        <TextFormatToolbar
          position={toolbarPosition}
          onBold={handleBold}
          onItalic={handleItalic}
          onUnderline={handleUnderline}
          onFont={handleFont}
          onColor={handleColor}
          currentFormat={currentFormat}
        />
      )}
    </>
  )
}

// Helper: converter RGB para Hex
function rgbToHex(rgb: string): string {
  if (rgb.startsWith('#')) return rgb

  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
  if (!match) return rgb

  const r = parseInt(match[1]).toString(16).padStart(2, '0')
  const g = parseInt(match[2]).toString(16).padStart(2, '0')
  const b = parseInt(match[3]).toString(16).padStart(2, '0')

  return `#${r}${g}${b}`
}
