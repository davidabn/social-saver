import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Bookmark, Image, Video, Grid, Settings, Layers, User, Rss, PenTool, Youtube, Instagram, Music2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'



const navItems = [
  { icon: <Grid className="h-4 w-4" />, label: 'Dashboard', path: '/dashboard' },
  { icon: <PenTool className="h-4 w-4" />, label: 'Design Carousel', path: '/carousel' },
  { icon: <Layers className="h-4 w-4" />, label: 'Meus Carrosséis', path: '/my-carousels' },
  { icon: <Bookmark className="h-4 w-4" />, label: 'Coleções', path: '/collections' },
  { icon: <Rss className="h-4 w-4" />, label: 'Feed', path: '/feed' },
  { icon: <User className="h-4 w-4" />, label: 'Persona', path: '/persona' },
  { icon: <Settings className="h-4 w-4" />, label: 'Configurações', path: '/settings' },
]

export function Sidebar() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentFilter = searchParams.get('filter') || 'all'
  const currentPlatform = searchParams.get('platform') || 'all'

  const handleFilterClick = (platform: string, type: string = 'all') => {
    const newParams = new URLSearchParams(searchParams)

    if (platform === 'all') {
      newParams.delete('platform')
      newParams.delete('filter')
    } else {
      newParams.set('platform', platform)
      if (type === 'all') {
        newParams.delete('filter')
      } else {
        newParams.set('filter', type)
      }
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

            <Button
              variant={currentPlatform === 'all' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3"
              onClick={() => handleFilterClick('all')}
            >
              <Grid className="h-4 w-4" />
              Todos
            </Button>

            <Button
              variant={currentPlatform === 'instagram' && currentFilter === 'all' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3"
              onClick={() => handleFilterClick('instagram')}
            >
              <Instagram className="h-4 w-4" />
              Instagram
              {currentPlatform === 'instagram' ? <ChevronDown className="ml-auto h-3 w-3" /> : <ChevronRight className="ml-auto h-3 w-3" />}
            </Button>

            {currentPlatform === 'instagram' && (
              <div className="ml-4 pl-4 border-l space-y-1 mt-1 mb-2">
                <Button
                  variant={currentFilter === 'post' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start gap-3 h-8 text-xs text-muted-foreground"
                  onClick={() => handleFilterClick('instagram', 'post')}
                >
                  <Image className="h-3 w-3" />
                  Posts
                </Button>
                <Button
                  variant={currentFilter === 'reel' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start gap-3 h-8 text-xs text-muted-foreground"
                  onClick={() => handleFilterClick('instagram', 'reel')}
                >
                  <Video className="h-3 w-3" />
                  Reels
                </Button>
                <Button
                  variant={currentFilter === 'carousel' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start gap-3 h-8 text-xs text-muted-foreground"
                  onClick={() => handleFilterClick('instagram', 'carousel')}
                >
                  <Layers className="h-3 w-3" />
                  Carrosséis
                </Button>
              </div>
            )}

            <Button
              variant={currentPlatform === 'youtube' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3"
              onClick={() => handleFilterClick('youtube')}
            >
              <Youtube className="h-4 w-4" />
              YouTube
            </Button>

            <Button
              variant={currentPlatform === 'tiktok' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3"
              onClick={() => handleFilterClick('tiktok')}
            >
              <Music2 className="h-4 w-4" />
              TikTok
            </Button>
          </>
        )}
      </nav>
    </aside>
  )
}
