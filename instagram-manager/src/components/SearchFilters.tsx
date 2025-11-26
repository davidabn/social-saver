import { useState } from 'react'
import { Search, Calendar, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface SearchFiltersProps {
  onSearch: (search: string) => void
  onDateFilter: (dateFrom: string | undefined, dateTo: string | undefined) => void
  isLoading?: boolean
}

export function SearchFilters({ onSearch, onDateFilter, isLoading }: SearchFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showDateFilter, setShowDateFilter] = useState(false)

  const handleSearch = () => {
    onSearch(searchTerm)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    onSearch('')
  }

  const handleApplyDateFilter = () => {
    onDateFilter(dateFrom || undefined, dateTo || undefined)
  }

  const handleClearDateFilter = () => {
    setDateFrom('')
    setDateTo('')
    onDateFilter(undefined, undefined)
  }

  const hasDateFilter = dateFrom || dateTo

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por perfil, legenda ou transcrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10"
            disabled={isLoading}
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button onClick={handleSearch} disabled={isLoading}>
          Buscar
        </Button>
        <Button
          variant={showDateFilter ? 'secondary' : 'outline'}
          onClick={() => setShowDateFilter(!showDateFilter)}
        >
          <Calendar className="h-4 w-4" />
        </Button>
      </div>

      {/* Date Filter */}
      {showDateFilter && (
        <div className="flex flex-wrap items-end gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="date-from" className="text-xs">De</Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="date-to" className="text-xs">Até</Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
          </div>
          <Button size="sm" onClick={handleApplyDateFilter}>
            Aplicar
          </Button>
          {hasDateFilter && (
            <Button size="sm" variant="ghost" onClick={handleClearDateFilter}>
              Limpar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
