import { useState, useRef } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUserFonts, useUploadFont, useDeleteFont, type UserFont } from '@/hooks/useUserFonts'
import { Upload, Trash2, Loader2, Type, AlertCircle, Check } from 'lucide-react'

interface FontManagerModalProps {
    open: boolean
    onClose: () => void
}

export function FontManagerModal({ open, onClose }: FontManagerModalProps) {
    const { data: fonts, isLoading } = useUserFonts()
    const uploadFont = useUploadFont()
    const deleteFont = useDeleteFont()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [dragOver, setDragOver] = useState(false)

    const handleFileSelect = async (files: FileList | null) => {
        if (!files?.length) return

        const file = files[0]
        const validExtensions = ['.ttf', '.otf', '.woff', '.woff2']
        const hasValidExt = validExtensions.some(ext =>
            file.name.toLowerCase().endsWith(ext)
        )

        if (!hasValidExt) {
            alert('Formato inválido. Use arquivos TTF, OTF, WOFF ou WOFF2.')
            return
        }

        try {
            await uploadFont.mutateAsync(file)
        } catch (error) {
            console.error('Failed to upload font:', error)
            alert('Falha ao fazer upload da fonte. Tente novamente.')
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        handleFileSelect(e.dataTransfer.files)
    }

    const handleDelete = async (font: UserFont) => {
        if (!confirm(`Deseja excluir a fonte "${font.name}"?`)) return

        try {
            await deleteFont.mutateAsync(font.id)
        } catch (error) {
            console.error('Failed to delete font:', error)
            alert('Falha ao excluir fonte. Tente novamente.')
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Type className="h-5 w-5" />
                        Minhas Fontes
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Upload area */}
                    <div
                        className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
              ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
              ${uploadFont.isPending ? 'pointer-events-none opacity-50' : ''}
            `}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".ttf,.otf,.woff,.woff2"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e.target.files)}
                        />

                        {uploadFont.isPending ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Enviando fonte...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <p className="font-medium">Arraste uma fonte aqui</p>
                                <p className="text-sm text-muted-foreground">
                                    ou clique para selecionar (TTF, OTF, WOFF, WOFF2)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Success message */}
                    {uploadFont.isSuccess && (
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950 p-2 rounded">
                            <Check className="h-4 w-4" />
                            Fonte importada com sucesso!
                        </div>
                    )}

                    {/* Error message */}
                    {uploadFont.isError && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                            <AlertCircle className="h-4 w-4" />
                            Erro ao importar fonte. Tente novamente.
                        </div>
                    )}

                    {/* Font list */}
                    <div className="space-y-2">
                        <h3 className="font-medium text-sm text-muted-foreground">
                            Fontes Importadas ({fonts?.length || 0})
                        </h3>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : fonts?.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                <Type className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Nenhuma fonte importada ainda</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {fonts?.map((font) => (
                                    <div
                                        key={font.id}
                                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center text-lg font-bold"
                                                style={{ fontFamily: font.family_name }}
                                            >
                                                Aa
                                            </div>
                                            <div>
                                                <p className="font-medium" style={{ fontFamily: font.family_name }}>
                                                    {font.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground uppercase">
                                                    {font.file_format}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(font)}
                                            disabled={deleteFont.isPending}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            {deleteFont.isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <p className="text-xs text-muted-foreground">
                        💡 As fontes importadas ficam disponíveis em todos os seus carrosséis.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
