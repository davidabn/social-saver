import { useState } from 'react'
import { saveAs } from 'file-saver'
import { useUserImages, useStorageUsage } from '@/hooks/useCarouselDesigner'
import { Loader2, Image as ImageIcon, Sparkles, Download, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from "@/components/ui/progress"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"

interface MediaLibraryProps {
    onSelectImage: (url: string) => void
}

export function MediaLibrary({ onSelectImage }: MediaLibraryProps) {
    const { data: images, isLoading, isError, error } = useUserImages()
    const { data: usageData } = useStorageUsage()
    const [activeTab, setActiveTab] = useState<'upload' | 'generated'>('upload')
    const [downloadingId, setDownloadingId] = useState<string | null>(null)

    const filteredImages = images?.filter(img => img.type === activeTab) || []

    // Calculate storage usage
    const storageUsage = usageData?.storage?.usage || 0
    const storageLimit = usageData?.storage?.limit || 25 * 1024 * 1024 * 1024 // Fallback to 25GB
    const storageUsedPercent = (storageUsage / storageLimit) * 100

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const handleDownload = async (imageUrl: string, id: string) => {
        try {
            setDownloadingId(id)
            // Extract filename from URL or use a default
            const fileName = `social-saver-${id.substring(0, 8)}.png`

            // Cloudinary URLs usually allow cross-origin but if not we might need to fetch as blob
            const response = await fetch(imageUrl)
            const blob = await response.blob()
            saveAs(blob, fileName)
        } catch (error) {
            console.error('[MediaLibrary] Download failed:', error)
        } finally {
            setDownloadingId(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-red-500">
                <p className="font-medium">Erro ao carregar imagens</p>
                <p className="text-sm mt-1">{error?.message}</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex gap-2 p-4 border-b bg-muted/30">
                <Button
                    variant={activeTab === 'upload' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setActiveTab('upload')}
                    className="flex-1"
                >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Uploads
                </Button>
                <Button
                    variant={activeTab === 'generated' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setActiveTab('generated')}
                    className="flex-1"
                >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Geradas com IA
                </Button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                {filteredImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-12 text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <ImageIcon className="h-8 w-8 opacity-20" />
                        </div>
                        <p className="font-medium">Nenhuma imagem encontrada</p>
                        <p className="text-sm mt-1 max-w-[250px]">
                            {activeTab === 'upload'
                                ? 'Faça upload de imagens no editor para vê-las aqui.'
                                : 'Gere imagens com IA para vê-las aqui.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredImages.map((image) => (
                            <ContextMenu key={image.id}>
                                <ContextMenuTrigger asChild>
                                    <button
                                        className="relative group aspect-square rounded-lg overflow-hidden bg-muted border-2 border-transparent transition-all hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                                        onClick={() => onSelectImage(image.url)}
                                    >
                                        <img
                                            src={image.url}
                                            alt="User asset"
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            loading="lazy"
                                        />

                                        {/* Overlay with info */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2 pointer-events-none">
                                            <span className="text-[10px] text-white/90 font-medium">
                                                {new Date(image.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                            </span>
                                            {downloadingId === image.id && (
                                                <Loader2 className="h-3 w-3 text-white animate-spin" />
                                            )}
                                        </div>
                                    </button>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                    <ContextMenuItem onClick={() => onSelectImage(image.url)}>
                                        Usar no Slide
                                    </ContextMenuItem>
                                    <ContextMenuItem onClick={() => handleDownload(image.url, image.id)}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Baixar Imagem
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
                        ))}
                    </div>
                )}
            </div>

            {/* Storage Usage Footer */}
            <div className="p-4 border-t bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center text-xs font-medium text-muted-foreground">
                        <Database className="h-3 w-3 mr-1.5" />
                        Espaço no Cloudinary
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                        {formatBytes(storageUsage)} / {formatBytes(storageLimit)}
                    </span>
                </div>
                <Progress value={storageUsedPercent} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground mt-2 text-right">
                    {storageUsedPercent.toFixed(1)}% utilizado
                </p>
            </div>
        </div>
    )
}
