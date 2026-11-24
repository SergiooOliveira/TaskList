import { fireEvent, render, screen } from '@testing-library/react'
import Login from './Login'
import { supabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => ({ supabase: { auth: { signInWithOtp: vi.fn() } } }))
const otp = vi.mocked(supabase.auth.signInWithOtp)

async function submit() {
  render(<Login />)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'me@example.com' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send login link' }))
}

it('sends a magic link and confirms', async () => {
  otp.mockResolvedValue({ error: null } as never)
  await submit()
  expect(otp).toHaveBeenCalledWith({ email: 'me@example.com', options: { emailRedirectTo: window.location.href } })
  expect(await screen.findByText('Check your email for the login link.')).toBeInTheDocument()
})

it('shows the error message', async () => {
  otp.mockResolvedValue({ error: { message: 'Rate limited' } } as never)
  await submit()
  expect(await screen.findByText('Rate limited')).toBeInTheDocument()
})

it('recovers when the request rejects', async () => {
  otp.mockRejectedValue(new Error('Network down'))
  await submit()
  expect(await screen.findByText('Network down')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Send login link' })).toBeEnabled()
})
