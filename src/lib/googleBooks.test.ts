import { buildQuery, findDetails, isIsbn, searchBooks, toCandidate } from './googleBooks'

const volume = (info: object) => ({ volumeInfo: { title: 'Lendários', authors: ['Tracy Deonn'], pageCount: 480, language: 'pt', publishedDate: '2021-09-01', ...info } })

test('isIsbn', () => {
  expect(isIsbn('978-972-25-1234-5')).toBe(true)
  expect(isIsbn('0 8044 2957 X')).toBe(true)
  expect(isIsbn('Lendários')).toBe(false)
})

test('toCandidate upgrades http covers and maps language', () => {
  const c = toCandidate(volume({ imageLinks: { thumbnail: 'http://books.google.com/x' } }))
  expect(c).toEqual({ title: 'Lendários', authors: ['Tracy Deonn'], pages: 480, language: 'Portuguese', cover: 'https://books.google.com/x', year: '2021', summary: null })
  expect(toCandidate(volume({ language: 'de' })).language).toBe('de')
})

test('toCandidate tolerates missing fields', () => {
  const c = toCandidate(volume({ pageCount: undefined }))
  expect(c.cover).toBeNull()
  expect(c.pages).toBeNull()
})

test('searchBooks builds the query and survives errors', async () => {
  const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ items: [volume({})] }) } as Response)
  expect(await searchBooks('isbn:9789722512345')).toHaveLength(1)
  expect(f.mock.calls[0][0]).toBe('https://www.googleapis.com/books/v1/volumes?q=isbn%3A9789722512345&maxResults=5')
  f.mockRejectedValue(new Error('x'))
  expect(await searchBooks('x')).toMatchObject({ ok: false })
  f.mockResolvedValue({ ok: true, json: async () => ({ totalItems: 0 }) } as Response)
  expect(await searchBooks('x')).toEqual([])
  f.mockResolvedValue({ ok: false, status: 429 } as Response)
  expect(await searchBooks('x')).toMatchObject({ ok: false })
})

test('searchBooks sends the API key when one is configured', async () => {
  vi.stubEnv('VITE_GOOGLE_BOOKS_KEY', 'k-123')
  const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({}) } as Response)
  await searchBooks('Dune')
  expect(String(f.mock.calls[0][0])).toContain('&key=k-123')
  vi.unstubAllEnvs()
  f.mockRestore()
})

test('searchBooks reports Google\'s reason on a refused request', async () => {
  const f = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 403, json: async () => ({ error: { message: 'Requests from referer are blocked.' } }) } as unknown as Response)
  expect(await searchBooks('x')).toEqual({ ok: false, reason: '403: Requests from referer are blocked.' })
  f.mockRestore()
})

test('regional language codes map to the base language', () => {
  expect(toCandidate(volume({ language: 'pt-BR' })).language).toBe('Portuguese')
})

test('description becomes a plain-text summary: tags stripped, entities decoded', () => {
  const c = toCandidate(volume({ description: '<p>Bree&#39;s <b>first</b> night &quot;at&quot; Carolina.</p><p>A secret society.<br>Arthur&amp;co.</p>' }))
  expect(c.summary).toBe('Bree\'s first night "at" Carolina.\nA secret society.\nArthur&co.')
  expect(toCandidate(volume({})).summary).toBeNull()
})

test('buildQuery uses title + author, or series + number for volume-only titles', () => {
  expect(buildQuery({ title: 'Lendários', author: 'Tracy Deonn', series: 'The Legendborn Cycle', number: '1' })).toBe('intitle:"Lendários" inauthor:"Tracy Deonn"')
  expect(buildQuery({ title: 'Volume I', author: 'Tsugumi Ohba', series: 'Death Note - Black Edition', number: '1' })).toBe('Death Note Black Edition 1 inauthor:"Tsugumi Ohba"')
  expect(buildQuery({ title: 'vol. 3', series: 'Berserk', number: '3' })).toBe('Berserk 3')
  expect(buildQuery({ title: '', series: 'One Piece', number: '' })).toBe('One Piece')
  expect(buildQuery({ title: '978-972-25-1234-5', author: 'X' })).toBe('isbn:9789722512345')
  expect(buildQuery({ title: '', author: 'X' })).toBeNull()
})

test('findDetails retries without the author when nothing matches', async () => {
  const f = vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce({ ok: true, json: async () => ({ totalItems: 0 }) } as Response)
    .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [volume({})] }) } as Response)
  expect(await findDetails({ title: 'Volume I', author: 'Ohba', series: 'Death Note', number: '1' })).toHaveLength(1)
  expect(decodeURIComponent(String(f.mock.calls[0][0]))).toContain('Death Note 1 inauthor:"Ohba"')
  expect(decodeURIComponent(String(f.mock.calls[1][0]))).toContain('q=Death Note 1&')
  f.mockRestore()
})
