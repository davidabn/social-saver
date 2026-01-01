import { Label } from '@/components/ui/label'
import type { CarouselTemplate, SlideLayoutType } from '@/types/template'

interface LayoutSelectorProps {
  template: CarouselTemplate
  value?: SlideLayoutType
  onChange: (layout: SlideLayoutType) => void
}

export function LayoutSelector({ template, value, onChange }: LayoutSelectorProps) {
  const layouts = Object.entries(template.layouts)

  return (
    <div className="space-y-2">
      <Label>Layout do Slide</Label>
      <div className="grid grid-cols-6 gap-1">
        {layouts.map(([key, layout]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key as SlideLayoutType)}
            className={`p-1 rounded border-2 transition-all ${
              value === key || (!value && key === 'imageTop')
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
            title={`${layout.name}: ${layout.description}`}
          >
            <LayoutIcon type={key as SlideLayoutType} />
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {value ? template.layouts[value]?.name : template.layouts.imageTop?.name}
      </p>
    </div>
  )
}

// Ícones representando cada layout
function LayoutIcon({ type }: { type: SlideLayoutType }) {
  const baseClass = 'w-full h-10 rounded border border-border flex flex-col overflow-hidden bg-background'

  switch (type) {
    case 'cover':
      return (
        <div className={baseClass}>
          <div className="flex-1 bg-muted" />
          <div className="h-3 bg-primary/20 p-0.5">
            <div className="w-full h-0.5 bg-primary" />
          </div>
        </div>
      )
    case 'imageTop':
      return (
        <div className={baseClass}>
          <div className="h-5 bg-muted m-0.5 rounded-sm" />
          <div className="flex-1 p-0.5 space-y-0.5">
            <div className="w-full h-0.5 bg-primary" />
            <div className="w-3/4 h-0.5 bg-muted-foreground/30" />
          </div>
        </div>
      )
    case 'textTop':
      return (
        <div className={baseClass}>
          <div className="p-0.5 space-y-0.5">
            <div className="w-full h-0.5 bg-primary" />
            <div className="w-2/3 h-0.5 bg-primary" />
          </div>
          <div className="flex-1 bg-muted m-0.5 rounded-sm" />
        </div>
      )
    case 'fullImage':
      return (
        <div className={baseClass}>
          <div className="flex-1 bg-muted relative">
            <div className="absolute inset-x-0.5 bottom-1 space-y-0.5">
              <div className="w-full h-0.5 bg-white" />
              <div className="w-2/3 h-0.5 bg-white/50" />
            </div>
          </div>
        </div>
      )
    case 'textOnly':
      return (
        <div className={baseClass + ' bg-muted/50'}>
          <div className="p-1 space-y-1">
            <div className="w-full h-0.5 bg-primary" />
            <div className="w-3/4 h-0.5 bg-primary" />
          </div>
          <div className="flex-1" />
          <div className="p-1 space-y-0.5">
            <div className="w-full h-0.5 bg-muted-foreground/30" />
          </div>
        </div>
      )
    case 'textImageText':
      return (
        <div className={baseClass + ' bg-orange-500/20'}>
          <div className="p-0.5 space-y-0.5">
            <div className="w-full h-0.5 bg-white" />
            <div className="w-2/3 h-0.5 bg-white" />
          </div>
          <div className="h-4 bg-muted mx-0.5 rounded-sm" />
          <div className="p-0.5 space-y-0.5">
            <div className="w-full h-0.5 bg-muted-foreground" />
          </div>
        </div>
      )
    default:
      return <div className={baseClass} />
  }
}
