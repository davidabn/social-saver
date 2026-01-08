import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useCarouselList, useDeleteCarousel, type CarouselListItem } from '@/hooks/useCarouselPersistence'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Trash2, Edit, Clock, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function MyCarousels() {
  const { data: carousels, isLoading } = useCarouselList()
  const deleteCarousel = useDeleteCarousel()
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<CarouselListItem | null>(null)

  const handleDelete = () => {
    if (deleteTarget) {
      deleteCarousel.mutate(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Meus Carrosséis</h1>
            <p className="text-muted-foreground">
              {carousels?.length || 0} carrossel(s) salvo(s)
            </p>
          </div>
          <Button onClick={() => navigate('/carousel')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Carrossel
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : carousels?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum carrossel salvo ainda.</p>
            <Button onClick={() => navigate('/carousel')} className="mt-4">
              Criar primeiro carrossel
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {carousels?.map((carousel) => (
              <Card key={carousel.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted rounded-md mb-3 overflow-hidden flex items-center justify-center">
                  <span className="text-4xl text-muted-foreground/50">📸</span>
                </div>
                <h3 className="font-medium truncate">{carousel.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {new Date(carousel.updated_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/carousel?id=${carousel.id}`)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteTarget(carousel)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir carrossel?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O carrossel "{deleteTarget?.name}" será
              permanentemente excluído.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCarousel.isPending}
            >
              {deleteCarousel.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}
