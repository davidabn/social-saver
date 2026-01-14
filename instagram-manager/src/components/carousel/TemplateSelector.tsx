import { Check, Layout } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { CarouselTemplate } from '@/types/template'
import { templates } from '@/templates'

interface TemplateSelectorProps {
  open: boolean
  onClose: () => void
  selectedTemplateId?: string
  onSelectTemplate: (template: CarouselTemplate | null) => void
}

export function TemplateSelector({
  open,
  onClose,
  selectedTemplateId,
  onSelectTemplate
}: TemplateSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Escolher Template
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Templates disponíveis */}
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              name={template.name}
              description={template.description}
              isSelected={selectedTemplateId === template.id}
              onClick={() => {
                onSelectTemplate(template)
                onClose()
              }}
              colors={[
                template.palette.primary,
                template.palette.background,
                template.palette.backgroundAlt,
                template.palette.text
              ]}
              layoutCount={Object.keys(template.layouts).length}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface TemplateCardProps {
  name: string
  description: string
  isSelected: boolean
  onClick: () => void
  colors: string[]
  layoutCount?: number
}

function TemplateCard({
  name,
  description,
  isSelected,
  onClick,
  colors,
  layoutCount
}: TemplateCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col p-4 rounded-lg border-2 transition-all text-left',
        'hover:border-primary hover:shadow-md',
        isSelected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-border bg-card'
      )}
    >
      {/* Indicador de selecionado */}
      {isSelected && (
        <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      {/* Preview de cores */}
      <div className="flex gap-1 mb-3">
        {colors.slice(0, 4).map((color, index) => (
          <div
            key={index}
            className="h-8 flex-1 rounded"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Nome e descrição */}
      <h3 className="font-semibold text-sm">{name}</h3>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
        {description}
      </p>

      {/* Contagem de layouts */}
      {layoutCount && (
        <div className="mt-2 text-xs text-muted-foreground">
          {layoutCount} layouts disponíveis
        </div>
      )}
    </button>
  )
}
