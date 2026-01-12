import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AddContentModal } from '@/components/AddContentModal'
import { ContentDetailModal } from '@/components/ContentDetailModal'
import { useCollection, useUpdateContentCollection } from '@/hooks/useCollections'
import { useDeleteContent } from '@/hooks/useContents'
import type { SavedContent } from '@/types'
import {
  ArrowLeft,
  Plus,
  Loader2,
  Heart,
  MessageCircle,
  Play,
  Trash2,
  ExternalLink,
  FolderMinus,
  Bookmark,
  Image,
  Layers,
  Music2,
  Calendar,
  FileText,
  Youtube
} from 'lucide-react'

const API_URL = 'http://localhost:3001/api'

function getProxyImageUrl(url: string | null): string | null {
  if (!url) return null
  return `${API_URL}/proxy/image?url=${encodeURIComponent(url)}`
}

function ContentCard({
  content,
  onDelete,
  onClick,
  onRemoveFromCollection
}: {
  content: SavedContent
  onDelete: () => void
  onClick: () => void
  onRemoveFromCollection: () => void
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Tem certeza que deseja excluir este conteudo?')) {
      setIsDeleting(true)
      onDelete()
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Remover este conteudo da colecao?')) {
      onRemoveFromCollection()
    }
  }

  const formatNumber = (num: number | null) => {
    if (num === null) return '-'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const thumbnailUrl = getProxyImageUrl(content.thumbnail_url)
  const profilePicUrl = getProxyImageUrl(content.author_profile_pic)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <Card className="overflow-hidden group cursor-pointer" onClick={onClick}>
      <div className="relative aspect-square bg-muted">
        {thumbnailUrl && !imageError ? (
          <img
            src={thumbnailUrl}
            alt={`Post de @${content.author_username}`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Bookmark className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Platform/Type Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {content.platform === 'youtube' ? (
            <div className="bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 shadow-sm">
              <Youtube className="h-3 w-3" />
              Youtube
            </div>
          ) : content.platform === 'tiktok' ? (
            <div className="bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <Music2 className="h-3 w-3" />
              TikTok
            </div>
          ) : (
            <>
              {content.content_type === 'reel' && (
                <div className="bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Play className="h-3 w-3" />
                  Reel
                </div>
              )}
              {content.content_type === 'post' && (
                <div className="bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Image className="h-3 w-3" />
                  Post
                </div>
              )}
              {content.content_type === 'carousel' && (
                <div className="bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  Carrossel
                </div>
              )}
            </>
          )}
        </div>

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => { e.stopPropagation(); window.open(content.instagram_url, '_blank') }}
            title={content.platform === 'youtube' ? 'Abrir no Youtube' : 'Abrir original'}
          >
            {content.platform === 'youtube' ? <Youtube className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleRemove}
            title="Remover da colecao"
          >
            <FolderMinus className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Excluir conteudo"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={profilePicUrl || undefined} />
            <AvatarFallback>{content.author_username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate">@{content.author_username}</span>
          {content.author_verified && (
            <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          )}
        </div>

        {content.caption && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {content.caption}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {formatNumber(content.likes_count)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {formatNumber(content.comments_count)}
          </span>
          {(content.plays_count || content.views_count) && (
            <span className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              {formatNumber(content.plays_count || content.views_count)}
            </span>
          )}
        </div>

        {/* Saved date and transcription status */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(content.saved_at)}
          </span>
          {(content.content_type === 'reel' || content.platform === 'youtube') && (
            <span className="flex items-center gap-1" title={`Transcrição: ${content.transcription_status}`}>
              <FileText className="h-3 w-3" />
              {content.transcription_status === 'completed' && (
                <span className="text-green-600">Transcrito</span>
              )}
              {content.transcription_status === 'processing' && (
                <span className="text-yellow-600">Processando</span>
              )}
              {content.transcription_status === 'pending' && (
                <span className="text-gray-400">Pendente</span>
              )}
              {content.transcription_status === 'failed' && (
                <span className="text-red-600">Falhou</span>
              )}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function CollectionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const filter = searchParams.get('filter') as 'all' | 'reel' | 'post' | 'carousel' | null

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null)

  const { data, isLoading, error } = useCollection(id || null, 1, filter || undefined)
  const deleteContent = useDeleteContent()
  const updateContentCollection = useUpdateContentCollection()

  if (!id) {
    navigate('/collections')
    return null
  }

  const collection = data?.collection
  const contents = data?.contents?.data || []

  const handleRemoveFromCollection = async (contentId: string) => {
    await updateContentCollection.mutateAsync({ contentId, collectionId: null })
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/collections')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{collection?.name || 'Carregando...'}</h1>
            {collection?.description && (
              <p className="text-muted-foreground">{collection.description}</p>
            )}
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Erro ao carregar colecao</p>
            <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
          </div>
        ) : contents.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <Bookmark className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Esta colecao esta vazia</h3>
            <p className="text-muted-foreground">
              Adicione conteudos a esta colecao
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              Adicionar Conteudo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {contents.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                onDelete={() => deleteContent.mutate(content.id)}
                onClick={() => setSelectedContentId(content.id)}
                onRemoveFromCollection={() => handleRemoveFromCollection(content.id)}
              />
            ))}
          </div>
        )}

        {/* Add Modal with pre-selected collection */}
        <AddContentModal
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          defaultCollectionId={id}
        />

        <ContentDetailModal
          contentId={selectedContentId}
          open={!!selectedContentId}
          onOpenChange={(open) => !open && setSelectedContentId(null)}
        />
      </div>
    </Layout>
  )
}
