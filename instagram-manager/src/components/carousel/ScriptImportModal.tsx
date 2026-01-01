import { useState, useMemo } from 'react'
import { FileText, Upload, AlertCircle, Sparkles, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { parseCarouselScript, type ParsedSlide } from '@/utils/scriptParser'
import { useParseScriptWithAI } from '@/hooks/useCarouselDesigner'

interface ScriptImportModalProps {
  open: boolean
  onClose: () => void
  onImport: (slides: ParsedSlide[]) => void
}

export function ScriptImportModal({
  open,
  onClose,
  onImport
}: ScriptImportModalProps) {
  const [script, setScript] = useState('')
  const [aiParsedSlides, setAiParsedSlides] = useState<ParsedSlide[] | null>(null)
  const [useAI, setUseAI] = useState(false)

  const parseWithAI = useParseScriptWithAI()

  // Parse script em tempo real para mostrar preview (regex)
  const regexParsedSlides = useMemo(() => {
    return parseCarouselScript(script)
  }, [script])

  // Usar slides da IA se disponivel, senao usar regex
  const parsedSlides = useAI && aiParsedSlides ? aiParsedSlides : regexParsedSlides

  const handleParseWithAI = async () => {
    if (!script.trim()) return

    try {
      setUseAI(true)
      const slides = await parseWithAI.mutateAsync({ script })
      // Converter para o formato ParsedSlide
      const converted: ParsedSlide[] = slides.map((slide, index) => ({
        slideNumber: slide.slideNumber || index + 1,
        headline: slide.headline,
        body: slide.body,
        layoutType: index === 0 ? 'cover' : 'imageTop'
      }))
      setAiParsedSlides(converted)
    } catch (error) {
      console.error('Failed to parse with AI:', error)
      setUseAI(false)
    }
  }

  const handleImport = () => {
    if (parsedSlides.length === 0) return
    onImport(parsedSlides)
    setScript('')
    setAiParsedSlides(null)
    setUseAI(false)
    onClose()
  }

  const handleClose = () => {
    setScript('')
    setAiParsedSlides(null)
    setUseAI(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Importar Script de Carrossel
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Textarea para colar o script */}
          <div className="flex-1 min-h-0">
            <label className="text-sm font-medium mb-2 block">
              Cole o script do carrossel:
            </label>
            <Textarea
              value={script}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setScript(e.target.value)}
              placeholder={`Cole aqui o texto dos slides. Exemplo:

**SLIDE 1 (Capa)**
O FIM DA PRIVACIDADE?
3 segundos para a IA "despir" qualquer foto sua.

**SLIDE 2**
Headline do segundo slide
Texto do body que explica mais detalhes sobre o assunto.

**SLIDE 3**
Outro headline impactante
Mais conteudo explicativo aqui...`}
              className="h-[250px] font-mono text-sm resize-none"
            />
          </div>

          {/* Preview dos slides detectados */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">Preview dos Slides</h3>
              {parsedSlides.length > 0 ? (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                  {parsedSlides.length} slide{parsedSlides.length !== 1 ? 's' : ''} detectado{parsedSlides.length !== 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Nenhum slide detectado
                </span>
              )}
            </div>

            {parsedSlides.length === 0 && script.trim() && !parseWithAI.isPending && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Formato nao reconhecido automaticamente.</span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleParseWithAI}
                  className="shrink-0"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Analisar com IA
                </Button>
              </div>
            )}

            {parseWithAI.isPending && (
              <div className="flex items-center gap-2 text-primary text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analisando script com IA...</span>
              </div>
            )}

            {useAI && aiParsedSlides && (
              <div className="flex items-center gap-2 text-green-600 text-sm mb-2">
                <Sparkles className="h-4 w-4" />
                <span>Analisado com IA</span>
              </div>
            )}

            {parsedSlides.length > 0 && (
              <div className="max-h-[150px] overflow-y-auto space-y-2">
                {parsedSlides.map((slide) => (
                  <div
                    key={slide.slideNumber}
                    className="flex items-start gap-3 p-2 bg-background rounded border text-sm"
                  >
                    <span className="bg-primary/10 text-primary font-medium px-2 py-0.5 rounded text-xs shrink-0">
                      {slide.slideNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{slide.headline || '(sem headline)'}</p>
                      <p className="text-muted-foreground text-xs truncate">
                        {slide.body || '(sem body)'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {slide.layoutType}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer com acoes */}
        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <div className="flex items-center gap-2">
            {script.trim() && !useAI && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleParseWithAI}
                disabled={parseWithAI.isPending}
              >
                {parseWithAI.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                Usar IA
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              {useAI ? 'Analisado com IA' : 'Layouts do template selecionado'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={parsedSlides.length === 0 || parseWithAI.isPending}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar {parsedSlides.length > 0 && `(${parsedSlides.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
