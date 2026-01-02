import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ContentDetailModal } from '@/components/ContentDetailModal'
import { useFeed, useProfiles, useAddProfile, useRefreshFeed, useDeleteProfile } from '@/hooks/useFeed'
import type { FeedItem } from '@/types'
import {
  Loader2,
  Plus,
  Search,
  RefreshCw,
  Grid,
  Image as ImageIcon,
  Video,
  Layers,
  Trash2
} from 'lucide-react'

const API_URL = 'http://localhost:3001/api'

function getProxyImageUrl(url: string | null): string | null {
  if (!url) return null
  return `${API_URL}/proxy/image?url=${encodeURIComponent(url)}`
}

export function Feed() {
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>()
  const [isAddProfileOpen, setIsAddProfileOpen] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null)

  const { data: profiles } = useProfiles()
  const { data: feedData, isLoading: feedLoading, refetch: refetchFeed } = useFeed(1, selectedProfileId)
  
  const addProfileMutation = useAddProfile()
  const refreshFeedMutation = useRefreshFeed()
  const deleteProfileMutation = useDeleteProfile()

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUsername.trim()) return
    try {
      await addProfileMutation.mutateAsync(newUsername.trim())
      setNewUsername('')
      setIsAddProfileOpen(false)
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeleteProfile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Tem certeza? Isso removerá o perfil e seus posts do feed.')) {
      await deleteProfileMutation.mutateAsync(id)
      if (selectedProfileId === id) setSelectedProfileId(undefined)
    }
  }

  const handleRefresh = async () => {
    await refreshFeedMutation.mutateAsync()
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'reel': return <Video className="h-4 w-4" />
      case 'carousel': return <Layers className="h-4 w-4" />
      default: return <ImageIcon className="h-4 w-4" />
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Feed Personalizado</h1>
            <p className="text-muted-foreground">
              Acompanhe os últimos posts dos seus perfis favoritos.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshFeedMutation.isPending}
              className="gap-2"
            >
              {refreshFeedMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Atualizar Feed
            </Button>
            <Button onClick={() => setIsAddProfileOpen(!isAddProfileOpen)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Perfil
            </Button>
          </div>
        </div>

        {/* Add Profile Form */}
        {isAddProfileOpen && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <form onSubmit={handleAddProfile} className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Nome de Usuário do Instagram</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                    <Input 
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      placeholder="usuario" 
                      className="pl-7"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={addProfileMutation.isPending}>
                  {addProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Adicionar
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Profiles Bar */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
           <div 
              className={`flex flex-col items-center gap-2 cursor-pointer min-w-[72px] ${!selectedProfileId ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
              onClick={() => setSelectedProfileId(undefined)}
            >
              <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center bg-background ${!selectedProfileId ? 'border-primary' : 'border-transparent'}`}>
                <Grid className="h-6 w-6 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium truncate w-full text-center">Todos</span>
            </div>

            {profiles?.map(profile => (
              <div 
                key={profile.id}
                className={`group relative flex flex-col items-center gap-2 cursor-pointer min-w-[72px] ${selectedProfileId === profile.id ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                onClick={() => setSelectedProfileId(profile.id)}
              >
                <Avatar className={`w-14 h-14 border-2 ${selectedProfileId === profile.id ? 'border-primary' : 'border-transparent'}`}>
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium truncate w-full text-center">@{profile.username}</span>
                
                <button 
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  onClick={(e) => handleDeleteProfile(profile.id, e)}
                  title="Remover perfil"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
        </div>

        {/* Feed Grid */}
        {feedLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : feedData?.data.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Nenhum post encontrado</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {selectedProfileId 
                ? 'Este perfil ainda nao tem posts monitorados.' 
                : 'Adicione perfis para comecar a ver posts aqui.'}
            </p>
            {!profiles?.length && (
              <Button variant="outline" onClick={() => setIsAddProfileOpen(true)}>
                Adicionar Primeiro Perfil
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {feedData?.data.map((item) => (
              <div 
                key={item.id} 
                className="group relative aspect-[9/16] bg-black rounded-lg overflow-hidden cursor-pointer border shadow-sm hover:shadow-md transition-all"
                onClick={() => setSelectedItem(item)}
              >
                {/* Media Thumbnail */}
                <img 
                  src={getProxyImageUrl(item.thumbnail_url) || '/placeholder.png'} 
                  alt={item.caption || 'Post thumbnail'}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
                
                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 opacity-60 group-hover:opacity-80 transition-opacity" />
                
                {/* Top Info */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border border-white/20">
                       {/* Use item.profile.avatar_url if populated in query (needs join) or fallback */}
                       <AvatarImage src={item.profile?.avatar_url || undefined} />
                       <AvatarFallback className="text-[10px] bg-black/50">
                          {item.profile?.username?.charAt(0).toUpperCase() || '?'}
                       </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium drop-shadow-md truncate max-w-[100px]">
                      @{item.profile?.username || 'user'}
                    </span>
                  </div>
                  <div className="bg-black/40 p-1 rounded text-white backdrop-blur-sm">
                    {getContentTypeIcon(item.content_type)}
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
                   {item.caption && (
                     <p className="text-xs line-clamp-2 opacity-90 mb-2">
                       {item.caption}
                     </p>
                   )}
                   
                   {item.is_saved ? (
                     <div className="inline-flex items-center gap-1 text-[10px] bg-green-500/20 text-green-200 px-2 py-0.5 rounded-full border border-green-500/30">
                       <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                       Salvo
                     </div>
                   ) : (
                      <span className="text-[10px] text-white/60">Clique para ver</span>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <ContentDetailModal
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
          contentId={null} // We pass feedItem instead
          feedItem={selectedItem}
          onFeedItemSaved={() => {
            refetchFeed()
          }}
        />
      </div>
    </Layout>
  )
}
