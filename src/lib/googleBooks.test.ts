import { isIsbn, searchBooks, toCandidate } from './googleBooks'

const volume = (info: object) => ({ volumeInfo: { title: 'Lendários', authors: ['Tracy Deonn'], pageCount: 480, language: 'pt', publishedDate: '2021-09-01', ...info } })

test('isIsbn', () => {
  expect(isIsbn('978-972-25-1234-5')).toBe(true)
  expect(isIsbn('0 8044 2957 X')).toBe(true)
  expect(isIsbn('Lendários')).toBe(false)
})

test('toCandidate upgrades http covers and maps language', () => {
  const c = toCandidate(volume({ imageLinks: { thumbnail: 'http://books.google.com/x' } }))
  expect(c).toEqual({ title: 'Lendários', authors: ['Tracy Deonn'], pages: 480, language: 'Portuguese', cover: 'https://books.google.com/x', year: '2021' })
  expect(toCandidate(volume({ language: 'de' })).language).toBe('de')
})

test('toCandidate tolerates missing fields', () => {
  const c = toCandidate(volume({ pageCount: undefined }))
  expect(c.cover).toBeNull()
  expect(c.pages).toBeNull()
})

test('searchBooks builds the query and survives errors', async () => {
  const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ items: [volume({})] }) } as Response)
  expect(await searchBooks('9789722512345')).toHaveLength(1)
  expect(f.mock.calls[0][0]).toBe('https://www.googleapis.com/books/v1/volumes?q=isbn%3A9789722512345&maxResults=5')
  f.mockRejectedValue(new Error('x'))
  expect(await searchBooks('x')).toEqual({ ok: false })
  f.mockResolvedValue({ ok: true, json: async () => ({ totalItems: 0 }) } as Response)
  expect(await searchBooks('x')).toEqual([])
  f.mockResolvedValue({ ok: false, status: 429 } as Response)
  expect(await searchBooks('x')).toEqual({ ok: false })
})
