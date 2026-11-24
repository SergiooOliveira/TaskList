import { fireEvent, render, screen } from '@testing-library/react'
import Login from './Login'
import { supabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => ({ supabase: { auth: { signInWithOtp: vi.fn(), verifyOtp: vi.fn() } } }))
const otp = vi.mocked(supabase.auth.signInWithOtp)

async function submit() {
  render(<Login />)
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'me@example.com' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send code' }))
}

it('sends a code and asks for it', async () => {
  otp.mockResolvedValue({ error: null } as never)
  await submit()
  expect(otp).toHaveBeenCalledWith({ email: 'me@example.com' })
  expect(await screen.findByText('We sent a sign-in code to me@example.com.')).toBeInTheDocument()
  expect(screen.getByLabelText('Code')).toBeInTheDocument()
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
  expect(screen.getByRole('button', { name: 'Send code' })).toBeEnabled()
})

describe('code', () => {
  const verify = vi.mocked(supabase.auth.verifyOtp)
  async function enter() {
    otp.mockResolvedValue({ error: null } as never)
    await submit()
    fireEvent.change(await screen.findByLabelText('Code'), { target: { value: ' 123456 ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  }
  it('verifies the code', async () => {
    verify.mockResolvedValue({ error: null } as never)
    await enter()
    await vi.waitFor(() => expect(verify).toHaveBeenCalledWith({ email: 'me@example.com', token: '123456', type: 'email' }))
  })
  it('goes back to change the email', async () => {
    await enter()
    fireEvent.click(screen.getByRole('button', { name: 'Use a different email' }))
    expect(screen.getByLabelText('Email')).toHaveValue('me@example.com')
  })
  it('shows the error', async () => {
    verify.mockResolvedValue({ error: { message: 'Token has expired or is invalid' } } as never)
    await enter()
    expect(await screen.findByText('Token has expired or is invalid')).toBeInTheDocument()
  })
})
