import { useState } from 'react'
import { Loader2, Link as LinkIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateContent } from '@/hooks/useContents'

interface AddContentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultCollectionId?: string
}

export function AddContentModal({ open, onOpenChange, defaultCollectionId: _defaultCollectionId }: AddContentModalProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const createContent = useCreateContent()

  const validateUrl = (url: string): boolean => {
    const instagramRegex = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|reels|tv)\/[\w-]+/i
    const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|shorts\/|live\/|embed\/)?[\w-]+/i
    // Matches standard tiktok.com/@user/video/ID and short links like vm.tiktok.com or vt.tiktok.com
    const tiktokRegex = /^https?:\/\/(www\.|vm\.|vt\.)?tiktok\.com\//i
    return instagramRegex.test(url) || youtubeRegex.test(url) || tiktokRegex.test(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!url.trim()) {
      setError('Por favor, insira uma URL')
      return
    }

    if (!validateUrl(url)) {
      setError('URL inválida. Use um link do Instagram, YouTube ou TikTok')
      return
    }

    try {
      await createContent.mutateAsync(url)
      setUrl('')
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar conteúdo')
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setUrl('')
      setError(null)
      createContent.reset()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Conteúdo</DialogTitle>
          <DialogDescription>
            Cole o link de um post do Instagram, vídeo do YouTube ou TikTok
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            {createContent.isPending && (
              <div className="p-3 text-sm text-blue-600 bg-blue-50 rounded-md flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando dados... Isso pode levar alguns segundos.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="url">URL do Conteúdo</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="url"
                  placeholder="Link do Instagram, YouTube ou TikTok..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10"
                  disabled={createContent.isPending}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Suporta: Instagram, YouTube e TikTok
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createContent.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createContent.isPending}>
              {createContent.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
