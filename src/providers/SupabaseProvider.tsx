import { createBrowserClient } from '@supabase/ssr'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useState } from 'react'

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      console.error('Missing Supabase environment variables')
    }
    
    return createBrowserClient(url!, key!)
  })

  return (
    <SessionContextProvider 
      supabaseClient={supabase}
      initialSession={null}
    >
      {children}
    </SessionContextProvider>
  )
}
