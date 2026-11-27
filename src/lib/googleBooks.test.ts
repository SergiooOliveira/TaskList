import { buildQuery, findDetails, isIsbn, rankCandidates, searchBooks, toCandidate, type Candidate } from './googleBooks'
import { toCandidate as fromOpenLibrary } from './openLibrary'

const volume = (info: object) => ({ volumeInfo: { title: 'Lendários', authors: ['Tracy Deonn'], pageCount: 480, language: 'pt', publishedDate: '2021-09-01', ...info } })

test('isIsbn', () => {
  expect(isIsbn('978-972-25-1234-5')).toBe(true)
  expect(isIsbn('0 8044 2957 X')).toBe(true)
  expect(isIsbn('Lendários')).toBe(false)
})

test('toCandidate upgrades http covers and maps language', () => {
  const c = toCandidate(volume({ imageLinks: { thumbnail: 'http://books.google.com/x' } }))
  expect(c).toEqual({ title: 'Lendários', authors: ['Tracy Deonn'], pages: 480, language: 'Portuguese', cover: 'https://books.google.com/x', year: '2021', summary: null, isbn: null })
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

const json = (body: object) => ({ ok: true, json: async () => body }) as Response
const refused = { ok: false, status: 403, json: async () => ({ error: { message: 'blocked' } }) } as unknown as Response
// Routes fetch by host: Google gets `google(url)`, Open Library gets `ol(url)`.
const route = (google: (u: string) => Response | Promise<Response>, ol: (u: string) => Response | Promise<Response>) =>
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (u) => new URL(String(u)).host === 'openlibrary.org' ? ol(String(u)) : google(String(u)))
const isbn13 = (n: string) => ({ industryIdentifiers: [{ type: 'ISBN_10', identifier: 'x' }, { type: 'ISBN_13', identifier: n }] })
afterEach(() => vi.restoreAllMocks())

test('toCandidate reads the ISBN, 13 before 10', () => {
  expect(toCandidate(volume(isbn13('9781'))).isbn).toBe('9781')
  expect(toCandidate(volume({ industryIdentifiers: [{ type: 'ISBN_10', identifier: '0804' }] })).isbn).toBe('0804')
})

test('same ISBN merges: one has the cover, the other the title', async () => {
  route(() => json({ items: [volume({ title: 'Harry Potter e a Pedra Filosofal', ...isbn13('978') }),
    volume({ title: '', imageLinks: { thumbnail: 'https://g/c.jpg' }, description: 'Longer summary.', ...isbn13('978') })] }), () => json({ docs: [] }))
  const r = await findDetails({ title: 'Harry Potter e a Pedra Filosofal', author: 'Rowling' }) as Candidate[]
  expect(r).toHaveLength(1) // the several Google queries return the same items; all merge
  expect(r[0]).toMatchObject({ title: 'Harry Potter e a Pedra Filosofal', cover: 'https://g/c.jpg', summary: 'Longer summary.', isbn: '978' })
})

test('a merged ISBN without a cover falls back to the Open Library ISBN cover', async () => {
  route(() => json({ items: [volume(isbn13('9789'))] }), () => json({ docs: [] }))
  const r = await findDetails({ title: 'Lendários' }) as Candidate[]
  expect(r[0].cover).toBe('https://covers.openlibrary.org/b/isbn/9789-M.jpg?default=false')
})

test('Open Library mapping', () => {
  expect(fromOpenLibrary({ title: 'Lendários', author_name: ['Tracy Deonn'], number_of_pages_median: 480, first_publish_year: 2021, language: ['por', 'eng'], isbn: ['9789', '978x'], cover_i: 42 }))
    .toEqual({ title: 'Lendários', authors: ['Tracy Deonn'], pages: 480, language: 'Portuguese', cover: 'https://covers.openlibrary.org/b/id/42-M.jpg', year: '2021', summary: null, isbn: '9789' })
  expect(fromOpenLibrary({ language: ['fre'] })).toMatchObject({ title: '', language: 'French', cover: null, isbn: null, pages: null })
})

test('ranking: title, then language, then cover, author, summary; untitled last', () => {
  const c = (x: Partial<Candidate>): Candidate => ({ title: 'T', authors: [], pages: null, language: null, cover: null, year: null, summary: null, isbn: null, ...x })
  const untitled = c({ title: '', language: 'Portuguese', cover: 'u' })
  const englishCover = c({ title: 'en', language: 'English', cover: 'x' })
  const ptNoCover = c({ title: 'pt', language: 'Portuguese' })
  const ptCover = c({ title: 'ptc', language: 'Portuguese', cover: 'y' })
  const byAuthor = c({ title: 'a', authors: ['J. K. Rówling'] })
  expect(rankCandidates([untitled, byAuthor, englishCover, ptNoCover, ptCover], { title: '', author: 'rowling', language: 'portuguese' }).map((x) => x.title))
    .toEqual(['ptc', 'pt', 'en', 'a', ''])
})

test('every strategy runs: intitle, plain words, series, langRestrict, Open Library', async () => {
  const f = route(() => json({}), () => json({ docs: [] }))
  await findDetails({ title: 'Lendários', author: 'Tracy Deonn', series: 'Legendborn', number: '1', language: 'Portuguese' })
  const urls = f.mock.calls.map((x) => decodeURIComponent(String(x[0])).replace(/\+/g, ' '))
  expect(urls).toEqual(expect.arrayContaining([
    expect.stringContaining('q=intitle:"Lendários" inauthor:"Tracy Deonn"&maxResults=5'),
    expect.stringContaining('q=Lendários Tracy Deonn&'),
    expect.stringContaining('q=Legendborn 1 Tracy Deonn&'),
    expect.stringContaining('inauthor:"Tracy Deonn"&maxResults=5&langRestrict=pt'),
    'https://openlibrary.org/search.json?title=Lendários&author=Tracy Deonn&limit=5',
  ]))
  expect(urls).toHaveLength(5)
})

test('volume-only titles search Open Library by series + number', async () => {
  const f = route(() => json({}), () => json({ docs: [] }))
  await findDetails({ title: 'Volume I', author: 'Ohba', series: 'Death Note', number: '1' })
  const urls = f.mock.calls.map((x) => decodeURIComponent(String(x[0])).replace(/\+/g, ' '))
  expect(urls).toContain('https://openlibrary.org/search.json?q=Death Note 1&author=Ohba&limit=5')
  expect(urls.some((u) => u.includes('q=Death Note 1 inauthor:"Ohba"'))).toBe(true)
})

test('an ISBN only hits the ISBN paths', async () => {
  const f = route(() => json({}), () => json({ docs: [] }))
  await findDetails({ title: '978-972-25-1234-5', author: 'X', series: 'S', language: 'English' })
  expect(f.mock.calls.map((x) => String(x[0]))).toEqual([
    'https://www.googleapis.com/books/v1/volumes?q=isbn%3A9789722512345&maxResults=5',
    'https://openlibrary.org/search.json?isbn=9789722512345&limit=5',
  ])
})

test('Google refusing still shows Open Library; both failing is an error with the reason', async () => {
  route(() => refused, () => json({ docs: [{ title: 'Lendários', author_name: ['Tracy Deonn'] }] }))
  expect(await findDetails({ title: 'Lendários' })).toMatchObject([{ title: 'Lendários', authors: ['Tracy Deonn'] }])
  vi.restoreAllMocks()
  route(() => refused, () => { throw new Error('offline') })
  expect(await findDetails({ title: 'Lendários' })).toEqual({ ok: false, reason: '403: blocked; network error' })
})
