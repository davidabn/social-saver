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
}

export function AddContentModal({ open, onOpenChange }: AddContentModalProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const createContent = useCreateContent()

  const validateUrl = (url: string): boolean => {
    const instagramRegex = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|reels|tv)\/[\w-]+/i
    return instagramRegex.test(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!url.trim()) {
      setError('Por favor, insira uma URL')
      return
    }

    if (!validateUrl(url)) {
      setError('URL inválida. Use um link de post, reel ou IGTV do Instagram')
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
            Cole o link de um post, reel ou IGTV do Instagram
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
                Buscando dados do Instagram... Isso pode levar alguns segundos.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="url">URL do Instagram</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="url"
                  placeholder="https://www.instagram.com/reel/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10"
                  disabled={createContent.isPending}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: instagram.com/p/..., instagram.com/reel/..., instagram.com/tv/...
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
