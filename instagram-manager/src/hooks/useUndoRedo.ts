import { useState, useCallback, useEffect } from 'react'

interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

interface UseUndoRedoReturn<T> {
  state: T
  setState: (newState: T | ((prev: T) => T)) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  clearHistory: () => void
  resetState: (newState: T) => void
}

export function useUndoRedo<T>(initialState: T, maxHistory = 50): UseUndoRedoReturn<T> {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: []
  })

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setHistory(prev => {
      const nextState = typeof newState === 'function'
        ? (newState as (prev: T) => T)(prev.present)
        : newState

      // Não adicionar ao histórico se o estado for igual
      if (JSON.stringify(nextState) === JSON.stringify(prev.present)) {
        return prev
      }

      return {
        past: [...prev.past, prev.present].slice(-maxHistory),
        present: nextState,
        future: []
      }
    })
  }, [maxHistory])

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev

      const previous = prev.past[prev.past.length - 1]
      const newPast = prev.past.slice(0, -1)

      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      }
    })
  }, [])

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev

      const next = prev.future[0]
      const newFuture = prev.future.slice(1)

      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      }
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory(prev => ({
      past: [],
      present: prev.present,
      future: []
    }))
  }, [])

  // Reset state sem adicionar ao histórico (para carregar carrossel salvo)
  const resetState = useCallback((newState: T) => {
    setHistory({
      past: [],
      present: newState,
      future: []
    })
  }, [])

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver focado em um input/textarea/contenteditable
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
      // Ctrl+Y como alternativa para redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clearHistory,
    resetState
  }
}
