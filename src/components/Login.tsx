import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [token, setToken] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
      })
      setMessage(error ? error.message : 'Check your email for the login link.')
      if (!error) setSent(true)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  // iPhone home-screen apps can't receive the magic-link session, so also accept the emailed code.
  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
      if (error) setMessage(error.message)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <h1>Wishlist</h1>
      <form className="add form" onSubmit={submit}>
        <label>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button type="submit" disabled={sending}>Send login link</button>
      </form>
      {sent && (
        <form className="add form" onSubmit={verify}>
          <label>
            Or enter the 6-digit code
            <input inputMode="numeric" autoComplete="one-time-code" required value={token} onChange={(e) => setToken(e.target.value)} />
          </label>
          <button type="submit" disabled={sending}>Sign in</button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </>
  )
}
