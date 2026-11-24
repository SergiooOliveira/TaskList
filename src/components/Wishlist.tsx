import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// Placeholder until Task 5.
export default function Wishlist({ session }: { session: Session }) {
  return (
    <div className="mock">
      <h1>Wishlist</h1>
      <p>{session.user.email}</p>
      <button onClick={() => supabase.auth.signOut()}>Sign out</button>
    </div>
  )
}
