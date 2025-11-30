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
  AlertCircle,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

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

function getProxyImageUrl(url: string | null): string | null {
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

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

  const handleDownload = async () => {
    if (!content) return

    setIsDownloading(true)
    try {
      const mediaList = content.carousel_media || 
        (content.image_urls?.map(url => ({ type: 'image', url } as const)) || [])

      if (mediaList.length === 0) {
        // Fallback for single video reel without carousel_media/image_urls
        if (content.video_url) {
           const url = getProxyVideoUrl(content.video_url)
           if (url) saveAs(url, `${content.post_id || 'instagram'}.mp4`)
        } else if (content.thumbnail_url) {
           const url = getProxyImageUrl(content.thumbnail_url)
           if (url) saveAs(url, `${content.post_id || 'instagram'}.jpg`)
        }
        return
      }

      if (mediaList.length === 1) {
        // Download single item
        const item = mediaList[0]
        const proxyUrl = item.type === 'video' ? getProxyVideoUrl(item.url) : getProxyImageUrl(item.url)
        const ext = item.type === 'video' ? 'mp4' : 'jpg'
        
        if (proxyUrl) {
          saveAs(proxyUrl, `${content.post_id || 'instagram'}.${ext}`)
        }
      } else {
        // Download zip of mixed media
        const zip = new JSZip()
        
        await Promise.all(mediaList.map(async (item, index) => {
          const proxyUrl = item.type === 'video' ? getProxyVideoUrl(item.url) : getProxyImageUrl(item.url)
          const ext = item.type === 'video' ? 'mp4' : 'jpg'
          
          if (proxyUrl) {
            try {
              const response = await fetch(proxyUrl)
              const blob = await response.blob()
              zip.file(`${content.post_id || 'media'}_${index + 1}.${ext}`, blob)
            } catch (e) {
              console.error(`Failed to download media ${index}`, e)
            }
          }
        }))

        const contentBlob = await zip.generateAsync({ type: 'blob' })
        saveAs(contentBlob, `${content.post_id || 'instagram_carousel'}.zip`)
      }
    } catch (error) {
      console.error('Failed to download content:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : prev))
  }

  const handleNextImage = () => {
    const max = (content?.carousel_media?.length || content?.image_urls?.length || 1) - 1
    setCurrentImageIndex((prev) => (prev < max ? prev + 1 : prev))
  }

  // Determine current media to display
  const mediaList = content?.carousel_media || 
    (content?.image_urls?.map(url => ({ type: 'image', url, thumbnail: undefined } as const)) || [])
  
  // If no list (e.g. single reel), make a fake one for the carousel logic if needed, 
  // or strictly rely on the View logic below. 
  // Actually, for single Reel, content_type is 'reel', handled separately in the UI block?
  // No, let's unify if possible, or keep the 'reel' check.
  // The current UI has: {content.content_type === 'reel' ... ? video : image}
  // We need to support Carousel containing Videos.

  const currentMedia = mediaList[currentImageIndex]
  // Fallback for single image/video if not in a list (shouldn't happen for scraped carousel)
  const showSingleReel = content?.content_type === 'reel' && content.video_url && mediaList.length === 0
  
  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setCurrentImageIndex(0)
      onOpenChange(val)
    }}>
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
              {/* Video Player / Image Carousel */}
              <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden group flex items-center justify-center">
                {showSingleReel ? (
                  <video
                    src={getProxyVideoUrl(content.video_url) || undefined}
                    controls
                    className="w-full h-full object-contain"
                    poster={content.thumbnail_url || undefined}
                  />
                ) : currentMedia ? (
                  <>
                    {currentMedia.type === 'video' ? (
                      <video
                        src={getProxyVideoUrl(currentMedia.url) || undefined}
                        controls
                        className="w-full h-full object-contain"
                        poster={currentMedia.thumbnail ? getProxyImageUrl(currentMedia.thumbnail) || undefined : undefined}
                      />
                    ) : (
                      <img
                        src={getProxyImageUrl(currentMedia.url) || undefined}
                        alt={`Slide ${currentImageIndex + 1}`}
                        className="w-full h-full object-contain transition-opacity duration-300"
                      />
                    )}
                    
                    {/* Carousel Controls */}
                    {mediaList.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 z-10"
                          onClick={handlePrevImage}
                          disabled={currentImageIndex === 0}
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 z-10"
                          onClick={handleNextImage}
                          disabled={currentImageIndex === mediaList.length - 1}
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                        
                        {/* Dots Indicator */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                          {mediaList.map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-1.5 rounded-full transition-all ${
                                idx === currentImageIndex 
                                  ? 'w-4 bg-white' 
                                  : 'w-1.5 bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
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
                  <div className="bg-muted/50 rounded-lg p-4 max-h-40 overflow-y-auto">
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

                {/* Transcription (Now for all types) */}
                <div className="flex-1 min-h-0 flex flex-col">
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
                  <div className="bg-muted/50 rounded-lg p-4 flex-1 overflow-y-auto min-h-[100px]">
                    {content.transcription_status === 'completed' && content.transcription?.text ? (
                      <p className="text-sm whitespace-pre-wrap">{content.transcription.text}</p>
                    ) : content.transcription_status === 'processing' ? (
                      <div className="flex items-center gap-2 text-muted-foreground h-full justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Processando transcricao...</span>
                      </div>
                    ) : content.transcription_status === 'failed' ? (
                      <div className="flex items-center justify-center h-full text-destructive">
                        <p className="text-sm">Falha na transcricao</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p className="text-sm">Nenhuma transcricao disponivel</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between mt-6 pt-4 border-t">
              <div className="flex gap-2">
                 {/* Download Button */}
                {(content.image_urls?.length || 0) > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={handleDownload} 
                    disabled={isDownloading}
                    className="gap-2"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {isDownloading ? 'Baixando...' : 'Baixar Imagens'}
                  </Button>
                )}
              </div>

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