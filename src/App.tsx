import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import Wishlist from './components/Wishlist'
import Background from './components/Background'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => {}) // stay signed out; Login shows
      .finally(() => setReady(true))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  return (
    <div className="mock">
      <Background />
      {ready && (session ? <Wishlist session={session} /> : <Login />)}
    </div>
  )
}
