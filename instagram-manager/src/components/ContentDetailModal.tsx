import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useContent } from '@/hooks/useContent'
import {
  Heart,
  MessageCircle,
  Eye,
  Play,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  BadgeCheck,
  FileText,
  AlertCircle
} from 'lucide-react'

interface ContentDetailModalProps {
  contentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const API_URL = 'http://localhost:3001/api'

function getProxyVideoUrl(url: string | null): string | null {
  if (!url) return null
  return `${API_URL}/proxy/image?url=${encodeURIComponent(url)}`
}

function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return num.toString()
}

export function ContentDetailModal({ contentId, open, onOpenChange }: ContentDetailModalProps) {
  const { data: content, isLoading, error } = useContent(contentId)
  const [copied, setCopied] = useState(false)

  const handleCopyTranscription = async () => {
    if (content?.transcription?.text) {
      await navigator.clipboard.writeText(content.transcription.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOpenInstagram = () => {
    if (content?.instagram_url) {
      window.open(content.instagram_url, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-destructive">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>Erro ao carregar conteudo</p>
          </div>
        ) : content ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={content.author_profile_pic || undefined} />
                  <AvatarFallback>
                    {content.author_username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <span>@{content.author_username}</span>
                    {content.author_verified && (
                      <BadgeCheck className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  {content.author_name && (
                    <p className="text-sm font-normal text-muted-foreground">
                      {content.author_name}
                    </p>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Video Player / Image */}
              <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
                {content.content_type === 'reel' && content.video_url ? (
                  <video
                    src={getProxyVideoUrl(content.video_url) || undefined}
                    controls
                    className="w-full h-full object-contain"
                    poster={content.thumbnail_url || undefined}
                  />
                ) : content.thumbnail_url ? (
                  <img
                    src={`${API_URL}/proxy/image?url=${encodeURIComponent(content.thumbnail_url)}`}
                    alt="Content"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <FileText className="h-12 w-12" />
                  </div>
                )}
              </div>

              {/* Info Panel */}
              <div className="flex flex-col gap-4">
                {/* Caption */}
                {content.caption && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{content.caption}</p>
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                    <Heart className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-lg font-semibold">{formatNumber(content.likes_count)}</p>
                      <p className="text-xs text-muted-foreground">Curtidas</p>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-lg font-semibold">{formatNumber(content.comments_count)}</p>
                      <p className="text-xs text-muted-foreground">Comentarios</p>
                    </div>
                  </div>

                  {content.views_count !== null && (
                    <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                      <Eye className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-lg font-semibold">{formatNumber(content.views_count)}</p>
                        <p className="text-xs text-muted-foreground">Visualizacoes</p>
                      </div>
                    </div>
                  )}

                  {content.plays_count !== null && (
                    <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                      <Play className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-lg font-semibold">{formatNumber(content.plays_count)}</p>
                        <p className="text-xs text-muted-foreground">Reproducoes</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Transcription */}
                {content.content_type === 'reel' && (
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Transcricao
                      </h3>
                      {content.transcription?.text && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyTranscription}
                          className="gap-2"
                        >
                          {copied ? (
                            <>
                              <Check className="h-4 w-4 text-green-500" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copiar
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                      {content.transcription_status === 'completed' && content.transcription?.text ? (
                        <p className="text-sm whitespace-pre-wrap">{content.transcription.text}</p>
                      ) : content.transcription_status === 'processing' ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Processando transcricao...</span>
                        </div>
                      ) : content.transcription_status === 'failed' ? (
                        <p className="text-sm text-destructive">Falha na transcricao</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Transcricao pendente</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button variant="outline" onClick={handleOpenInstagram} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Abrir no Instagram
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
