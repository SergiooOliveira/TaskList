import { fireEvent, render, screen } from '@testing-library/react'
import Login from './Login'
import { supabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => ({ supabase: { auth: { signInWithOtp: vi.fn(), verifyOtp: vi.fn() } } }))
const otp = vi.mocked(supabase.auth.signInWithOtp)

async function submit() {
  render(<Login />)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'me@example.com' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send login link' }))
}

it('sends a magic link and confirms', async () => {
  otp.mockResolvedValue({ error: null } as never)
  await submit()
  expect(otp).toHaveBeenCalledWith({ email: 'me@example.com', options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL } })
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

describe('6-digit code', () => {
  const verify = vi.mocked(supabase.auth.verifyOtp)
  async function enter() {
    otp.mockResolvedValue({ error: null } as never)
    await submit()
    await screen.findByText('Check your email for the login link.')
    fireEvent.change(screen.getByLabelText('Or enter the 6-digit code'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  }
  it('verifies the code', async () => {
    verify.mockResolvedValue({ error: null } as never)
    await enter()
    await vi.waitFor(() => expect(verify).toHaveBeenCalledWith({ email: 'me@example.com', token: '123456', type: 'email' }))
  })
  it('shows the error', async () => {
    verify.mockResolvedValue({ error: { message: 'Token has expired or is invalid' } } as never)
    await enter()
    expect(await screen.findByText('Token has expired or is invalid')).toBeInTheDocument()
  })
})
