import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useContent } from '@/hooks/useContent'
import { useGenerateContent } from '@/hooks/useAI'
import type { FeedItem, TranscriptionStatus, ContentWithTranscription } from '@/types' // Add imports
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
  ChevronRight,
  Sparkles,
  Palette,
  Youtube,
  Music2
} from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'


interface ContentDetailModalProps {
  contentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  feedItem?: FeedItem | null // Add feedItem
  onFeedItemSaved?: () => void // Add callbak
}

const API_URL = 'http://localhost:3001/api'

function getProxyVideoUrl(url: string | null): string | null {
  if (!url) return null
  return `${API_URL}/proxy/image?url=${encodeURIComponent(url)}`
}

function getProxyImageUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('data:')) return url
  if (url.includes('/api/proxy/')) return url

  const bypassHosts = [
    'unsplash.com',
    'pexels.com',
    'pixabay.com',
    'supabase.co',
    'kie.ai',
    'aiquickdraw.com',
    'replicate.delivery',
    'cloudinary.com',
    'ytimg.com',
    'ggpht.com',
    'googleusercontent.com'
  ]

  if (bypassHosts.some(host => url.includes(host))) {
    return url
  }

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

export function ContentDetailModal({ contentId, open, onOpenChange, feedItem, onFeedItemSaved }: ContentDetailModalProps) {
  const navigate = useNavigate()
  const { data: apiContent, isLoading, error } = useContent(contentId)

  // Silenciar aviso de não uso por enquanto (será usado para implementar botão salvar futuramente)
  useEffect(() => {
    if (onFeedItemSaved) { /* placeholder */ }
  }, [onFeedItemSaved])

  // Map feedItem to SavedContent structure for display
  const content: ContentWithTranscription | null | undefined = (apiContent as ContentWithTranscription) || (feedItem ? {
    id: feedItem.id,
    user_id: '',
    instagram_url: feedItem.url,
    post_id: feedItem.post_id,
    platform: feedItem.platform,
    content_type: feedItem.content_type,
    author_username: feedItem.profile?.username || '',
    author_name: null,
    author_profile_pic: feedItem.profile?.avatar_url || null,
    author_verified: false,
    caption: feedItem.caption,
    thumbnail_url: feedItem.thumbnail_url,
    video_url: null,
    image_urls: null,
    carousel_media: null,
    likes_count: 0,
    comments_count: 0,
    views_count: null,
    plays_count: null,
    posted_at: feedItem.posted_at,
    saved_at: '',
    is_processed: false,
    transcription_status: 'pending' as TranscriptionStatus,
    transcription: null,
    collection_id: null,
    generated_script: null,
    generated_scripts: null,
    created_at: '',
    updated_at: ''
  } : null)
  const generateContent = useGenerateContent()
  const [copied, setCopied] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [generatedScript, setGeneratedScript] = useState<string | null>(null)
  const [scriptType, setScriptType] = useState<'post' | 'reel' | 'carousel'>('reel')
  const [scriptCopied, setScriptCopied] = useState(false)

  // Initialize scriptType from content content_type
  useEffect(() => {
    if (content?.content_type && open) {
      setScriptType(content.content_type)
    }
  }, [content?.content_type, open])

  // Initialize generated script from saved content based on selected type
  useEffect(() => {
    if (content?.generated_scripts && content.generated_scripts[scriptType]) {
      setGeneratedScript(content.generated_scripts[scriptType])
    } else {
      setGeneratedScript(null)
    }
  }, [content, scriptType])

  const handleCopyTranscription = async () => {
    if (content?.transcription?.text) {
      await navigator.clipboard.writeText(content.transcription.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleGenerateScript = async () => {
    if (!content?.id) return
    try {
      const result = await generateContent.mutateAsync({
        contentId: content.id,
        type: scriptType
      })
      setGeneratedScript(result.content)
    } catch (error) {
      console.error('Failed to generate script:', error)
    }
  }

  const handleCopyScript = async () => {
    if (generatedScript) {
      await navigator.clipboard.writeText(generatedScript)
      setScriptCopied(true)
      setTimeout(() => setScriptCopied(false), 2000)
    }
  }

  const handleGenerateDesign = () => {
    if (generatedScript && content?.id) {
      navigate('/carousel', {
        state: {
          script: generatedScript,
          contentId: content.id
        }
      })
    }
  }

  const handleOpenExternal = () => {
    if (content?.instagram_url) {
      window.open(content.instagram_url, '_blank')
    }
  }

  // Unified media list logic
  const getMediaList = () => {
    if (!content) return []

    // If it's a Reel or YouTube or TikTok with a video URL, treat it as a single video item
    if ((content.content_type === 'reel' || content.platform === 'youtube' || content.platform === 'tiktok') && content.video_url) {
      return [{
        type: 'video' as const,
        url: content.video_url,
        thumbnail: content.thumbnail_url || undefined
      }]
    }

    // If it has carousel media (rich structure), use it
    if (content.carousel_media && content.carousel_media.length > 0) {
      return content.carousel_media
    }

    // Fallback to image_urls (single post or simple carousel)
    if (content.image_urls && content.image_urls.length > 0) {
      return content.image_urls.map(url => ({
        type: 'image' as const,
        url,
        thumbnail: undefined
      }))
    }

    return []
  }

  const mediaList = getMediaList()

  const handleDownload = async () => {
    if (!content || mediaList.length === 0) return

    setIsDownloading(true)
    try {
      if (mediaList.length === 1) {
        // Download single item
        const item = mediaList[0]
        const proxyUrl = item.type === 'video' ? getProxyVideoUrl(item.url) : getProxyImageUrl(item.url)
        const ext = item.type === 'video' ? 'mp4' : 'jpg'
        const filename = `${content.post_id || 'instagram'}.${ext}`

        if (proxyUrl) {
          await saveAs(proxyUrl, filename)
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
    const max = mediaList.length - 1
    setCurrentImageIndex((prev) => (prev < max ? prev + 1 : prev))
  }

  const currentMedia = mediaList[currentImageIndex]

  const getDownloadLabel = () => {
    if (content?.platform === 'youtube') return 'Baixar do Youtube'
    if (content?.platform === 'tiktok') return 'Baixar TikTok'
    if (content?.content_type === 'reel') return 'Baixar Reel'
    if (content?.content_type === 'carousel') return 'Baixar Mídia'
    return 'Baixar Imagem'
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) {
        setCurrentImageIndex(0)
        setGeneratedScript(null)
      }
      onOpenChange(val)
    }}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-destructive h-full">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>Erro ao carregar conteudo</p>
          </div>
        ) : content ? (
          <>
            <DialogHeader className="flex-shrink-0 p-6 pb-2">
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

            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 pt-2 overflow-hidden">
              {/* Left Column: Video/Image - Fits available height */}
              <div className="h-full w-full bg-black rounded-lg flex items-center justify-center overflow-hidden relative group">
                {currentMedia ? (
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
                              className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex
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

              {/* Right Column: Info - Flex layout, no outer scroll */}
              <div className="flex flex-col gap-3 h-full min-h-0 overflow-hidden">
                {/* Caption - Fixed max height scrollable */}
                {content.caption && (
                  <div className="bg-muted/50 rounded-lg p-3 max-h-24 shrink-0 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{content.caption}</p>
                  </div>
                )}

                {/* Metrics - Fixed height */}
                <div className="flex flex-wrap gap-2 shrink-0">
                  <div className="bg-muted/50 rounded-lg px-3 py-2 flex items-center gap-2 flex-1 min-w-[110px]">
                    <Heart className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm font-semibold">{formatNumber(content.likes_count)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Curtidas</p>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg px-3 py-2 flex items-center gap-2 flex-1 min-w-[110px]">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-semibold">{formatNumber(content.comments_count)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Comentários</p>
                    </div>
                  </div>

                  {content.views_count !== null && (
                    <div className="bg-muted/50 rounded-lg px-3 py-2 flex items-center gap-2 flex-1 min-w-[110px]">
                      <Eye className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm font-semibold">{formatNumber(content.views_count)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Views</p>
                      </div>
                    </div>
                  )}

                  {content.plays_count !== null && (
                    <div className="bg-muted/50 rounded-lg px-3 py-2 flex items-center gap-2 flex-1 min-w-[110px]">
                      <Play className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-sm font-semibold">{formatNumber(content.plays_count)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">Plays</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Transcription (Now for all types) */}
                <div className="flex-1 min-h-[30px] flex flex-col overflow-hidden shrink">
                  <div className="flex items-center justify-between mb-1 shrink-0">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Transcrição
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
                  <div className="bg-muted/50 rounded-lg p-4 flex-1 overflow-y-auto">
                    {content.transcription_status === 'completed' && content.transcription?.text ? (
                      <p className="text-sm whitespace-pre-wrap">{content.transcription.text}</p>
                    ) : content.transcription_status === 'processing' ? (
                      <div className="flex items-center gap-2 text-muted-foreground h-full justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Processando transcrição...</span>
                      </div>
                    ) : content.transcription_status === 'failed' ? (
                      <div className="flex items-center justify-center h-full text-destructive">
                        <p className="text-sm">Falha na transcrição</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p className="text-sm">Nenhuma transcrição disponível</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Script Generation - Fixed height footer in right column */}
                <div className="flex flex-col gap-2 pt-2 border-t shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Gerar Roteiro
                    </h3>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={scriptType === 'post' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setScriptType('post')}
                      className="flex-1"
                    >
                      Post
                    </Button>
                    <Button
                      variant={scriptType === 'reel' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setScriptType('reel')}
                      className="flex-1"
                    >
                      Reel
                    </Button>
                    <Button
                      variant={scriptType === 'carousel' ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setScriptType('carousel')}
                      className="flex-1"
                    >
                      Carrossel
                    </Button>
                  </div>

                  <Button
                    onClick={handleGenerateScript}
                    disabled={generateContent.isPending}
                    className="w-full gap-2"
                  >
                    {generateContent.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Gerar Roteiro de {scriptType === 'post' ? 'Post' : scriptType === 'reel' ? (content?.platform === 'youtube' ? 'Vídeo' : content?.platform === 'tiktok' ? 'TikTok' : 'Reel') : 'Carrossel'}
                      </>
                    )}
                  </Button>

                  {/* Generated Script Display */}
                  {generatedScript && (
                    <div className="mt-1 flex flex-col gap-1 min-h-0">
                      <div className="flex items-center justify-between shrink-0 bg-background py-0.5">
                        <span className="text-sm font-medium">Roteiro Gerado</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyScript}
                          className="h-7 text-xs gap-1"
                        >
                          {scriptCopied ? (
                            <>
                              <Check className="h-3 w-3 text-green-500" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copiar
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2 overflow-y-auto max-h-20 shrink-0">
                        <p className="text-xs whitespace-pre-wrap">{generatedScript}</p>
                      </div>
                    </div>
                  )}

                  {generateContent.isError && (
                    <p className="text-sm text-destructive">
                      Erro ao gerar roteiro. Verifique se sua persona esta configurada.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-between p-6 pt-4 border-t flex-shrink-0 bg-background">
              <div className="flex gap-2">
                {mediaList.length > 0 && (
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
                    {isDownloading ? 'Baixando...' : getDownloadLabel()}
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                {/* Botão Gerar Design - Agora no rodapé ao lado de Abrir na Plataforma */}
                {generatedScript && scriptType === 'carousel' && (
                  <Button
                    onClick={handleGenerateDesign}
                    className="gap-2"
                    variant="secondary"
                  >
                    <Palette className="h-4 w-4" />
                    Gerar Design do Carrossel
                  </Button>
                )}

                <Button variant="outline" onClick={handleOpenExternal} className="gap-2">
                  {content?.platform === 'youtube' ? (
                    <>
                      <Youtube className="h-4 w-4 text-red-500" />
                      Abrir no Youtube
                    </>
                  ) : content?.platform === 'tiktok' ? (
                    <>
                      <Music2 className="h-4 w-4" />
                      Abrir no TikTok
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4" />
                      Abrir no Instagram
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
