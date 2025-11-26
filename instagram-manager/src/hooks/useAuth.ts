import { useState, useEffect, useCallback } from 'react'
import type { User, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UseAuthReturn {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAuthError = (err: AuthError) => {
    switch (err.message) {
      case 'Invalid login credentials':
        setError('Email ou senha inválidos')
        break
      case 'User already registered':
        setError('Este email já está cadastrado')
        break
      default:
        setError(err.message)
    }
  }

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) handleAuthError(signInError)
    setLoading(false)
  }, [])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true)
    setError(null)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })
    if (signUpError) handleAuthError(signUpError)
    setLoading(false)
  }, [])

  const signOut = useCallback(async () => {
    setLoading(true)
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) setError(signOutError.message)
    setLoading(false)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { user, loading, error, signIn, signUp, signOut, clearError }
}
