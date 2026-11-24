import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  // Runs one auth call with the busy flag and error message handled the same way for both steps.
  const run = async (e: React.FormEvent, call: () => Promise<{ error: { message: string } | null }>, onOk?: () => void) => {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const { error } = await call()
      if (error) setMessage(error.message)
      else onOk?.()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const sendCode = (e: React.FormEvent) => run(e, () => supabase.auth.signInWithOtp({ email }), () => setSent(true))
  const verify = (e: React.FormEvent) =>
    run(e, () => supabase.auth.verifyOtp({ email, token: token.trim(), type: 'email' }))

  return (
    <div className="login">
      <h1>Wishlist</h1>
      <p className="tagline">The things you want, in one calm place.</p>
      {!sent ? (
        <form className="add form" onSubmit={sendCode}>
          <label>
            Email
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button type="submit" disabled={busy}>Send code</button>
        </form>
      ) : (
        <form className="add form" onSubmit={verify}>
          <p className="muted">We sent a sign-in code to {email}.</p>
          <label>
            Code
            <input className="code" inputMode="numeric" autoComplete="one-time-code" required autoFocus
              value={token} onChange={(e) => setToken(e.target.value)} />
          </label>
          <button type="submit" disabled={busy}>Sign in</button>
          <button type="button" className="link" onClick={() => { setSent(false); setToken(''); setMessage('') }}>
            Use a different email
          </button>
        </form>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  )
}
