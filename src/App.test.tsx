import { render, screen } from '@testing-library/react'
import App from './App'

it('renders the heading and a decorative background', () => {
  const { container } = render(<App />)
  expect(screen.getByRole('heading', { name: 'Wishlist' })).toBeInTheDocument()
  expect(container.querySelector('[aria-hidden="true"] svg')).not.toBeNull()
})
