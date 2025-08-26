import { create } from 'zustand'
import { supabase } from '../utils/supabase'
import type { User, Client } from '../types'

interface AuthState {
  user: User | null
  client: Client | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  setClient: (client: Client | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  client: null,
  loading: true,
  setUser: (user) => set({ user }),
  setClient: (client) => set({ client }),
  login: async (username, password) => {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*, clients(*)')
      .eq('username', username)
      .single()

    if (userError) throw new Error('Invalid username or password')

    // In a real app, you should hash the password and compare it with password_hash
    // For now, we're just checking if the user exists
    if (!userData) throw new Error('Invalid username or password')

    const user: User = {
      id: userData.id,
      client_id: userData.client_id,
      username: userData.username,
      role: userData.role,
      created_at: new Date(userData.created_at)
    }

    const client: Client = {
      id: userData.clients.id,
      name: userData.clients.name,
      store_name: userData.clients.store_name,
      logo_url: userData.clients.logo_url,
      subscription_end: userData.clients.subscription_end ? new Date(userData.clients.subscription_end) : undefined,
      language: userData.clients.language,
      created_at: new Date(userData.clients.created_at)
    }

    set({ user, client })
  },
  logout: async () => {
    set({ user: null, client: null })
  },
}))
