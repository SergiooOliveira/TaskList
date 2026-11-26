import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import BookForm from './BookForm'
import * as items from '../../lib/items'
import * as reads from '../../lib/reads'
import * as gb from '../../lib/googleBooks'

vi.mock('../../lib/supabase', () => ({ supabase: {} }))
vi.mock('../../lib/items', async (orig) => ({ ...(await orig<typeof items>()), addItem: vi.fn(), updateItem: vi.fn(), deleteItem: vi.fn() }))
vi.mock('../../lib/reads', async (orig) => ({ ...(await orig<typeof reads>()), updateRead: vi.fn() }))

const cand: gb.Candidate = { title: 'Lendários', authors: ['Tracy Deonn'], pages: 480, language: 'Portuguese', cover: 'https://img.test/c.jpg', year: '2021' }
const setup = (props: Partial<React.ComponentProps<typeof BookForm>> = {}) => {
  const onSaved = vi.fn(), onCancel = vi.fn()
  render(<BookForm initial={{}} collection="book" forms={['Prose']} onSaved={onSaved} onCancel={onCancel} {...props} />)
  return { onSaved, onCancel }
}
const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(items.addItem).mockImplementation(async (p) => ({ id: 'n', ...p }) as items.Item)
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

test('no results keeps the form editable', async () => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))
  setup()
  type('Title', 'Zzz')
  fireEvent.click(screen.getByRole('button', { name: 'Find details' }))
  expect(await screen.findByText('No matches. Fill in the details yourself.')).toBeInTheDocument()
  type('Pages', '12')
  expect(screen.getByLabelText('Pages')).toHaveValue('12')
})

test('picking a candidate fills the fields', async () => {
  vi.spyOn(gb, 'searchBooks').mockResolvedValue([cand])
  setup()
  type('Title', 'Lend')
  fireEvent.click(screen.getByRole('button', { name: 'Find details' }))
  fireEvent.click(await screen.findByRole('button', { name: /Lendários/ }))
  expect(screen.getByLabelText('Title')).toHaveValue('Lendários')
  expect(screen.getByLabelText('Author')).toHaveValue('Tracy Deonn')
  expect(screen.getByLabelText('Pages')).toHaveValue('480')
  expect(screen.getByLabelText('Language')).toHaveValue('Portuguese')
  expect(screen.getByLabelText('Cover URL')).toHaveValue('https://img.test/c.jpg')
})

test('I want it saves an unbought book; price and genres are parsed', async () => {
  const { onSaved } = setup()
  type('Title', 'Marca')
  type('Price (€)', '24,90')
  type('Genres', ' fantasy, ,YA ')
  fireEvent.click(screen.getByRole('radio', { name: 'I want it' }))
  fireEvent.click(screen.getByRole('button', { name: '4 stars' }))
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(onSaved).toHaveBeenCalled())
  expect(items.addItem).toHaveBeenCalledWith(expect.objectContaining({
    title: 'Marca', collection: 'book', bought: false, bought_on: null, price_cents: 2490, genres: ['fantasy', 'YA'], rating: 4,
  }))
})

test('I own it saves bought today', async () => {
  const { onSaved } = setup()
  type('Title', 'Marca')
  fireEvent.click(screen.getByRole('radio', { name: 'I own it' }))
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(onSaved).toHaveBeenCalled())
  expect(items.addItem).toHaveBeenCalledWith(expect.objectContaining({ bought: true, bought_on: reads.todayISO(), genres: null, rating: null }))
})

test('form picker is labelled Form', () => {
  setup()
  expect(screen.getByRole('combobox', { name: 'Form' })).toBeInTheDocument()
})

test('title is required and bad price blocks saving', () => {
  setup()
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect(screen.getByText('Add a title')).toBeInTheDocument()
  type('Title', 'x'); type('Price (€)', 'abc')
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect(items.addItem).not.toHaveBeenCalled()
})

test('editing an owned book updates it and its latest read dates; delete confirms in place', async () => {
  const initial = { id: 'b1', title: 'Old', bought: true, bought_on: '2026-01-01', collection: 'book' as const }
  const read = { id: 'r1', item_id: 'b1', started_on: '2026-02-01', finished_on: null, before_app: false }
  vi.mocked(items.updateItem).mockImplementation(async (id, p) => ({ ...initial, ...p, id }) as items.Item)
  vi.mocked(reads.updateRead).mockResolvedValue(read)
  const { onSaved } = setup({ initial, reads: [read] })
  type('Finished on', '2026-03-01')
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(onSaved).toHaveBeenCalled())
  expect(items.updateItem).toHaveBeenCalledWith('b1', expect.objectContaining({ title: 'Old', bought: true, bought_on: '2026-01-01' }))
  expect(reads.updateRead).toHaveBeenCalledWith('r1', { started_on: '2026-02-01', finished_on: '2026-03-01' })
})

test('delete confirms in the dialog', async () => {
  vi.mocked(items.deleteItem).mockResolvedValue()
  const { onSaved } = setup({ initial: { id: 'b1', title: 'Old', bought: true } })
  fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
  expect(items.deleteItem).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
  await waitFor(() => expect(items.deleteItem).toHaveBeenCalledWith('b1'))
  await waitFor(() => expect(onSaved).toHaveBeenCalled())
})

const owned = { id: 'b1', title: 'Old', bought: true, bought_on: '2026-01-01', collection: 'book' as const }
const rr = (id: string, o: Partial<reads.Read>): reads.Read => ({ id, item_id: 'b1', started_on: null, finished_on: null, before_app: false, ...o })

test('finish before start and finish without start are rejected', () => {
  setup({ initial: owned, reads: [rr('r1', { started_on: '2026-02-01' })] })
  type('Finished on', '2026-01-15')
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect(screen.getByText("Finish can't be before start")).toBeInTheDocument()
  type('Started on', '')
  type('Finished on', '2026-03-01')
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect(screen.getByText('Add a start date first')).toBeInTheDocument()
  expect(reads.updateRead).not.toHaveBeenCalled()
  expect(items.updateItem).not.toHaveBeenCalled()
})

test('edits the latest read even when reads come out of order', () => {
  setup({ initial: owned, reads: [
    rr('old', { started_on: '2025-01-01', finished_on: '2025-02-01' }),
    rr('pre', { before_app: true }),
    rr('new', { started_on: '2026-03-01', finished_on: '2026-04-01' }),
  ] })
  expect(screen.getByLabelText('Started on')).toHaveValue('2026-03-01')
  cleanup()
  setup({ initial: owned, reads: [rr('done', { started_on: '2025-01-01', finished_on: '2026-09-01' }), rr('open', { started_on: '2024-01-01' })] })
  expect(screen.getByLabelText('Started on')).toHaveValue('2024-01-01')
})
