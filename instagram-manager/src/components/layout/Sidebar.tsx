import { Link, useLocation } from 'react-router-dom'
import { Bookmark, Image, Video, Grid, Tag, Clock, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

const filterItems = [
  { icon: <Grid className="h-4 w-4" />, label: 'Todos', active: true },
  { icon: <Image className="h-4 w-4" />, label: 'Imagens' },
  { icon: <Video className="h-4 w-4" />, label: 'Videos' },
  { icon: <Bookmark className="h-4 w-4" />, label: 'Colecoes' },
  { icon: <Tag className="h-4 w-4" />, label: 'Tags' },
  { icon: <Clock className="h-4 w-4" />, label: 'Recentes' },
]

const navItems = [
  { icon: <Grid className="h-4 w-4" />, label: 'Dashboard', path: '/dashboard' },
  { icon: <Settings className="h-4 w-4" />, label: 'Configuracoes', path: '/settings' },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <nav className="flex-1 space-y-1 p-4">
        {/* Navigation */}
        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Menu</p>
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant={location.pathname === item.path ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-3"
            asChild
          >
            <Link to={item.path}>
              {item.icon}
              {item.label}
            </Link>
          </Button>
        ))}

        {/* Filters (only show on dashboard) */}
        {location.pathname === '/dashboard' && (
          <>
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 mt-6">Filtros</p>
            {filterItems.map((item) => (
              <Button
                key={item.label}
                variant={item.active ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3"
                disabled={!item.active}
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </>
        )}
      </nav>
    </aside>
  )
}
