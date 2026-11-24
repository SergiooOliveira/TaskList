import { useState } from 'react'
import Background from './Background'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.href },
      })
      setMessage(error ? error.message : 'Check your email for the login link.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mock">
      <Background />
      <h1>Wishlist</h1>
      <form onSubmit={submit}>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button type="submit" disabled={sending}>Send login link</button>
      </form>
      {message && <p role="status">{message}</p>}
    </div>
  )
}
