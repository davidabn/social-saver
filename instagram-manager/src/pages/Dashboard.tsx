import { useState } from 'react'
import { Plus, Bookmark, Loader2, Heart, MessageCircle, Play, Trash2, ExternalLink, Calendar, FileText } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AddContentModal } from '@/components/AddContentModal'
import { ContentDetailModal } from '@/components/ContentDetailModal'
import { SearchFilters } from '@/components/SearchFilters'
import { useContents, useDeleteContent, type ContentFilters } from '@/hooks/useContents'
import type { SavedContent } from '@/types'

const API_URL = 'http://localhost:3001/api'

function getProxyImageUrl(url: string | null): string | null {
  if (!url) return null
  return `${API_URL}/proxy/image?url=${encodeURIComponent(url)}`
}

function ContentCard({ content, onDelete, onClick }: { content: SavedContent; onDelete: () => void; onClick: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir este conteúdo?')) {
      setIsDeleting(true)
      onDelete()
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

        {content.content_type === 'reel' && (
          <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <Play className="h-3 w-3" />
            Reel
          </div>
        )}

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => { e.stopPropagation(); window.open(content.instagram_url, '_blank') }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => { e.stopPropagation(); handleDelete() }}
            disabled={isDeleting}
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
          {content.content_type === 'reel' && (
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

export function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null)
  const [filters, setFilters] = useState<ContentFilters>({})
  const { data, isLoading, error } = useContents(filters)
  const deleteContent = useDeleteContent()

  const contents = data?.data || []
  const hasContents = contents.length > 0
  const hasFilters = filters.search || filters.dateFrom || filters.dateTo

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search: search || undefined }))
  }

  const handleDateFilter = (dateFrom: string | undefined, dateTo: string | undefined) => {
    setFilters(prev => ({ ...prev, dateFrom, dateTo }))
  }

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Meus Conteúdos</h1>
            <p className="text-muted-foreground">
              {hasContents
                ? `${data?.pagination.total} conteúdo(s) ${hasFilters ? 'encontrado(s)' : 'salvo(s)'}`
                : hasFilters ? 'Nenhum conteúdo encontrado' : 'Gerencie seus conteúdos salvos do Instagram'}
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <SearchFilters
            onSearch={handleSearch}
            onDateFilter={handleDateFilter}
            isLoading={isLoading}
          />
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-destructive">Erro ao carregar conteúdos</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </div>
        ) : hasContents ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {contents.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                onDelete={() => deleteContent.mutate(content.id)}
                onClick={() => setSelectedContentId(content.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Bookmark className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">
                  {hasFilters ? 'Nenhum conteúdo encontrado' : 'Nenhum conteúdo salvo ainda'}
                </h2>
                <p className="text-muted-foreground max-w-sm">
                  {hasFilters
                    ? 'Tente ajustar os filtros ou termo de busca'
                    : 'Clique no botão + para adicionar seu primeiro conteúdo do Instagram'}
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          title="Adicionar conteúdo"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>

        <AddContentModal open={isModalOpen} onOpenChange={setIsModalOpen} />

        <ContentDetailModal
          contentId={selectedContentId}
          open={!!selectedContentId}
          onOpenChange={(open) => !open && setSelectedContentId(null)}
        />
      </div>
    </Layout>
  )
}
