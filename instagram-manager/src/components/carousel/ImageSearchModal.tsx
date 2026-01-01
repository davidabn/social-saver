import { useState } from 'react'
import { Search, Loader2, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSearchImages } from '@/hooks/useCarouselDesigner'
import type { ImageSearchResult } from '@/types/carousel'

interface ImageSearchModalProps {
  open: boolean
  onClose: () => void
  onSelectImage: (imageUrl: string) => void
  initialQuery?: string
}

export function ImageSearchModal({
  open,
  onClose,
  onSelectImage,
  initialQuery = ''
}: ImageSearchModalProps) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<ImageSearchResult[]>([])
  const searchImages = useSearchImages()

  const handleSearch = async () => {
    if (!query.trim()) return

    try {
      const images = await searchImages.mutateAsync({ query, count: 8 })
      setResults(images)
    } catch (error) {
      console.error('Failed to search images:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSelectImage = (url: string) => {
    onSelectImage(url)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Buscar Imagens</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva a imagem que procura..."
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={searchImages.isPending || !query.trim()}
          >
            {searchImages.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">Buscar</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {searchImages.isPending && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Buscando imagens...</span>
            </div>
          )}

          {searchImages.isError && (
            <div className="text-center py-12 text-destructive">
              <p>Erro ao buscar imagens. Tente novamente.</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchImages.error?.message}
              </p>
            </div>
          )}

          {!searchImages.isPending && results.length === 0 && !searchImages.isError && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Digite uma busca para encontrar imagens</p>
              <p className="text-sm mt-1">
                Use termos descritivos para melhores resultados
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((image, index) => (
                <div
                  key={index}
                  className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary cursor-pointer transition-all"
                  onClick={() => handleSelectImage(image.url)}
                >
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.parentElement?.classList.add('hidden')
                    }}
                  />

                  {/* Overlay with info */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                    <p className="text-white text-xs font-medium line-clamp-2">
                      {image.title}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <ExternalLink className="h-3 w-3 text-white/70" />
                      <span className="text-white/70 text-[10px] truncate">
                        {image.source}
                      </span>
                    </div>
                  </div>

                  {/* Selection indicator */}
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs">+</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <p className="text-xs text-muted-foreground">
            Clique em uma imagem para selecioná-la
          </p>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
