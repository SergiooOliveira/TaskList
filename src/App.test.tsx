import { render, screen } from '@testing-library/react'
import App from './App'

const session = vi.hoisted(() => ({ current: null as unknown }))
vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: session.current } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
}))
vi.mock('./lib/items', () => ({ listItems: () => Promise.resolve([]) }))

it('renders the heading and a decorative background', async () => {
  session.current = null
  const { container } = render(<App />)
  expect(await screen.findByRole('heading', { name: 'Wishlist' })).toBeInTheDocument()
  expect(container.querySelector('[aria-hidden="true"] svg')).not.toBeNull()
})

it('shows Home for a session', async () => {
  session.current = {}
  render(<App />)
  expect(await screen.findByRole('link', { name: /Library/ })).toBeInTheDocument()
})
