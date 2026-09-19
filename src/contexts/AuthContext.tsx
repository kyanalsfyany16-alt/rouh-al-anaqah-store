import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile, UserRole } from '../lib/types'
import type { Session, User } from '@supabase/supabase-js'

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  role: UserRole | null
  loading: boolean
  isStaff: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  isCustomer: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null; role?: UserRole }>
  signUp: (email: string, password: string, firstName?: string, lastName?: string, phone?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  refreshProfile: () => Promise<void>
  hasRole: (...roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const user = session?.user ?? null
  const role = profile?.role ?? null
  const isStaff = role === 'employee' || role === 'admin' || role === 'super_admin'
  const isAdmin = role === 'admin' || role === 'super_admin'
  const isSuperAdmin = role === 'super_admin'
  const isCustomer = role === 'customer'

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      setProfile(null)
      return null
    }

    // Account disabled → force sign out (security)
    if (data.is_active === false) {
      await supabase.auth.signOut()
      setProfile(null)
      setSession(null)
      return null
    }

    setProfile(data as Profile)
    return data as Profile
  }, [])

  // Single source of truth: getSession on mount + onAuthStateChange for subsequent events
  useEffect(() => {
    let mounted = true

    // Initial load
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!mounted) return
      setSession(initialSession)
      if (initialSession?.user) {
        await fetchProfile(initialSession.user.id)
      }
      setLoading(false)
    })

    // Listen to all auth events without loop: only react to session presence
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (nextSession?.user) {
          await fetchProfile(nextSession.user.id)
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
      }

      // Ensure loading is false after any event
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signIn = async (email: string, password: string): Promise<{ error: Error | null; role?: UserRole }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error as Error }
    if (!data.user || !data.session) return { error: new Error('فشل تسجيل الدخول') }

    // Fetch fresh profile directly (not from stale closure)
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    if (prof) {
      if (prof.is_active === false) {
        await supabase.auth.signOut()
        return { error: new Error('الحساب معطل، تواصل مع الإدارة') }
      }
      setProfile(prof as Profile)
      return { error: null, role: (prof as Profile).role }
    }
    return { error: null }
  }

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string, phone?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, phone },
      },
    })
    // on_auth_user_created trigger creates profile with role=customer
    return { error: error as Error | null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    return { error: error as Error | null }
  }

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id)
    }
  }

  const hasRole = (...roles: UserRole[]) => {
    return role ? roles.includes(role) : false
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role,
        loading,
        isStaff,
        isAdmin,
        isSuperAdmin,
        isCustomer,
        signIn,
        signUp,
        signOut,
        resetPassword,
        refreshProfile,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
