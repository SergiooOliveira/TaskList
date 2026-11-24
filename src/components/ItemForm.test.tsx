import { fireEvent, render, screen } from '@testing-library/react'
import ItemForm from './ItemForm'

const setup = (initial = {}) => {
  const onSave = vi.fn()
  render(<ItemForm initial={{ url: 'https://www.x.test/a', title: 'Cam', ...initial }} onSave={onSave} onCancel={vi.fn()} />)
  const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
  const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  return { onSave, type, save }
}

it('requires a name', () => {
  const { onSave, type, save } = setup()
  type('Name', '  ')
  save()
  expect(screen.getByText('Add a name')).toBeInTheDocument()
  expect(onSave).not.toHaveBeenCalled()
})
it('converts the price to cents', () => {
  const { onSave, type, save } = setup()
  type('Price (€)', '1.299,99')
  save()
  expect(onSave).toHaveBeenCalledWith({ url: 'https://www.x.test/a', title: 'Cam', image_url: null, store: 'x.test', price_cents: 129999 })
})
it('saves an empty price as null', () => {
  const { onSave, save } = setup()
  save()
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ price_cents: null }))
})
it('rejects a non-http link', () => {
  const { onSave, type, save } = setup()
  type('Link', 'javascript:x')
  save()
  expect(screen.getByText('Use a http or https link')).toBeInTheDocument()
  expect(onSave).not.toHaveBeenCalled()
})
it('rejects an unparseable price and a bad picture URL', () => {
  const { onSave, type, save } = setup()
  type('Price (€)', 'abc')
  save()
  expect(screen.getByText('Use a price like 12,99')).toBeInTheDocument()
  type('Price (€)', '')
  type('Picture URL', 'ftp://x')
  save()
  expect(screen.getAllByText('Use a http or https link')).toHaveLength(1)
  expect(onSave).not.toHaveBeenCalled()
})
