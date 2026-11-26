import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Login from './components/Login'
import Wishlist from './components/Wishlist'
import Home from './components/Home'
import { useRoute } from './lib/route'
import Background from './components/Background'
import Stats from './components/library/Stats'
import Library from './components/library/Library'
import ItemPage from './components/library/ItemPage'
import GenreList from './components/library/GenreList'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const route = useRoute()
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
      {!(session && route.name !== 'home' && route.name !== 'wishlist') && <Background />}
      {ready && (!session ? <Login /> : route.name === 'wishlist' ? <Wishlist /> : route.name === 'home' ? <Home />
        : route.name === 'library' ? <Library kind={route.kind} view={route.view} />
        : route.name === 'item' ? <ItemPage id={route.id} edit={route.edit} />
        : route.name === 'genre' ? <GenreList genre={route.genre} /> : <Stats />)}
    </div>
  )
}
