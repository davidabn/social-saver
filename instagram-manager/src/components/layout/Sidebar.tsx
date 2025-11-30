import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Bookmark, Image, Video, Grid, Tag, Clock, Settings, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'

const filterItems = [
  { icon: <Grid className="h-4 w-4" />, label: 'Todos', value: 'all' },
  { icon: <Layers className="h-4 w-4" />, label: 'Carrosséis', value: 'carousel' },
  { icon: <Image className="h-4 w-4" />, label: 'Posts', value: 'post' },
  { icon: <Video className="h-4 w-4" />, label: 'Vídeos', value: 'reel' },
  { icon: <Bookmark className="h-4 w-4" />, label: 'Colecoes', value: 'collections' },
  { icon: <Tag className="h-4 w-4" />, label: 'Tags', value: 'tags' },
  { icon: <Clock className="h-4 w-4" />, label: 'Recentes', value: 'recent' },
]

const navItems = [
  { icon: <Grid className="h-4 w-4" />, label: 'Dashboard', path: '/dashboard' },
  { icon: <Settings className="h-4 w-4" />, label: 'Configuracoes', path: '/settings' },
]

export function Sidebar() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentFilter = searchParams.get('filter') || 'all'

  const handleFilterClick = (value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value === 'all') {
      newParams.delete('filter')
    } else {
      newParams.set('filter', value)
    }
    setSearchParams(newParams)
  }

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
            {filterItems.map((item) => {
              const isActive = item.value === currentFilter || (item.value === 'all' && !searchParams.get('filter'))
              // Disable collections, tags, recent for now as they are not implemented in backend filtering yet logic
              const isDisabled = ['collections', 'tags', 'recent'].includes(item.value)
              
              return (
                <Button
                  key={item.label}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-3"
                  onClick={() => !isDisabled && handleFilterClick(item.value)}
                  disabled={isDisabled}
                >
                  {item.icon}
                  {item.label}
                </Button>
              )
            })}
          </>
        )}
      </nav>
    </aside>
  )
}
