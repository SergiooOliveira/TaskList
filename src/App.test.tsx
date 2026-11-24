import { render, screen } from '@testing-library/react'
import App from './App'

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  },
}))

it('renders the heading and a decorative background', async () => {
  const { container } = render(<App />)
  expect(await screen.findByRole('heading', { name: 'Wishlist' })).toBeInTheDocument()
  expect(container.querySelector('[aria-hidden="true"] svg')).not.toBeNull()
})
