import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  useCollections,
  useCreateCollection,
  useDeleteCollection
} from '@/hooks/useCollections'
import {
  Plus,
  FolderOpen,
  Loader2,
  Trash2,
  Image as ImageIcon
} from 'lucide-react'

const API_URL = 'http://localhost:3001/api'

function getProxyImageUrl(url: string | null): string | null {
  if (!url) return null
  return `${API_URL}/proxy/image?url=${encodeURIComponent(url)}`
}

export function Collections() {
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useCollections()
  const createCollection = useCreateCollection()
  const deleteCollection = useDeleteCollection()

  const collections = data?.data || []

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setError(null)

    try {
      await createCollection.mutateAsync({ name: newName.trim() })
      setNewName('')
      setIsCreating(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar colecao')
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Excluir esta colecao? Os conteudos nao serao excluidos.')) {
      try {
        await deleteCollection.mutateAsync(id)
      } catch (err) {
        console.error(err)
      }
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Colecoes</h1>
            <p className="text-muted-foreground">
              Organize seus conteudos salvos em colecoes
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Colecao
          </Button>
        </div>

        {/* Create Form */}
        {isCreating && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleCreate} className="space-y-3">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    {error}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome da colecao"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                    disabled={createCollection.isPending}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false)
                      setNewName('')
                      setError(null)
                    }}
                    disabled={createCollection.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createCollection.isPending || !newName.trim()}>
                    {createCollection.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Criar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Collections Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Nenhuma colecao criada</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Crie colecoes para organizar seus conteudos salvos
            </p>
            <Button onClick={() => setIsCreating(true)}>
              Criar Primeira Colecao
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {collections.map((collection) => (
              <Link key={collection.id} to={`/collections/${collection.id}`}>
                <Card className="group overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
                  {/* Cover Image */}
                  <div className="aspect-video bg-muted relative">
                    {collection.cover_image_url ? (
                      <img
                        src={getProxyImageUrl(collection.cover_image_url) || ''}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FolderOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDelete(collection.id, e)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-medium truncate">{collection.name}</h3>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {collection.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>{collection.content_count} conteudo(s)</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
