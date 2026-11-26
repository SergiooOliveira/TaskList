# Library (Books & Manga): design

Status: draft for approval. It builds on `2026-11-25-collections-roadmap.md` and replaces that file's "Books" section.

## Why

You track your books in Notion ("Dark Academia Library"). It works, but it isn't fun. This brings your books and manga into the Wishlist app, with the same quick, phone-first feel and a look of their own. It adds what Notion doesn't give easily:
- yearly reading numbers
- a view of what you've spent

## Goals

1. **Home screen.** After login you see your collections: **Wishlist** and **Library**. Tap one to open it.
2. **Library** with two tabs: **Books** and **Manga**.
   - Inside each tab, filter by **form** (Prose, Poetry, …). Forms are free text, picked or created with the existing searchable picker, so there are no duplicates.
   - **Books** lists your owned books: cover, title, author, series and number, reading state, and rating.
   - **Manga** groups volumes **by series**: one row per series, with a volume bar of owned vs. known volumes (known = owned + wanted). Tap the row to open the volumes.
3. **Wishlist and Library are the same list (Approach B).**
   - An entry can belong to a **collection screen**: Book or Manga now, Vinyl and Game in later rounds. Entries without one are general wishlist items.
   - **The main Wishlist shows only general items.** Your own **types** stay exactly as today: free text, created with the picker, coloured, and used as filter chips. Collection items never appear there.
   - **Each collection screen has its own wishlist.** The Library has a **Shelf | Wishlist** switch in both tabs. Wanted books and manga live there, and the Shelf shows what you own.
   - **Ticking "Bought"** flips an entry from wanted to owned. Nothing is copied or moved. The price becomes **what you paid**, and today's date is stored as the purchase date.
4. **Adding a book.** In the Library, **+** opens a modal:
   - Choose **I own it** or **I want it**.
   - Type a title or ISBN, then **Find details** to fill in the cover, author, pages and language from Google Books. Pick the right edition from the results.
   - Every field stays editable, and manual entry always works.
5. **Reading** is a list of **reads** per book (started on, finished on).
   - "Currently reading" = a read with no finish date.
   - **Start reading**, **Finished** and **Read again** are one tap each.
   - Re-reads count each time.
   - Books read before the app have a **"before the app"** read with no dates.
6. **Reading dashboard**, per year, with a year picker plus an **All time** view:
   - books and pages finished, split into Books vs Manga
   - covers of every book finished that year
   - books finished per month (bar chart)
   - top genres
   - average rating
   - longest book
   - **Before the app:** a separate block with the count and pages of the undated books (30 books, 8,644 pages today)
7. **Spending dashboard.** All-time totals, plus per year from the purchase date (imported books count as "before the app"):
   - total paid and average price
   - by store (Bertrand, Fnac, Gift…)
   - by collection and by form
   - by genre (a book counts fully in each of its genres)
   - most-bought authors and series
8. **Themes per screen.** The layout and header are identical everywhere; only colours, fonts and background art change.
   - Home and Wishlist: Emerald Night, as today.
   - Books: **Nightshade**, approved on the canvas: ink-black and gold, belladonna branch and moth, a blackletter title, Cinzel tabs.
   - Manga: **Higanbana**: ink-black and vermilion, red spider lilies, a red moon, Shippori Mincho.
   - Switching Books ↔ Manga must not move any control.
9. **Import your Notion library once**: 45 books, details below.

## Non-goals (this round)

- Vinyls, Games, the Steam dashboard, and series suggestions ("you own book 1, add the rest"). These are later rounds of the roadmap. Until their screens exist, vinyls and games stay in the main Wishlist under your own types.
- Reading progress by page (e.g. "p. 212 / 573"). Progress is per book: reading or finished.
- Total volume counts for a manga series that you haven't added as owned or wanted.
- Sharing, multiple users, a public app.
- Offline use.

## Anti-goals

- Controls that shift position between tabs or screens.
- Decoration that pushes content down. Art sits **behind** the content. The list starts near the top (64px top padding, per the canvas).
- Losing or double-counting a book when it's bought: there's one row per book, always.
- Losing any wishlist item or type that exists today.

## Constraints

- **Existing stack:** Vite + React + TypeScript, Supabase (login + Postgres with row-level security), GitHub Pages (static, served under `/TaskList/`).
- **Prices:** cents, EUR. Dates follow the browser locale. The Notion dates are **MM/DD/YYYY** (confirmed: `06/09/2026` = 9 June 2026).
- **Stores still block automated reads,** so prices are never fetched. Google Books is called straight from the browser (it allows that).
- The app must work at phone width first.
- **Tests:** Vitest. Parsing, the import mapping and the stats maths each need tests.

## Approaches considered

| | Trade-off | Decision |
|---|---|---|
| A. Wishlist and library as two separate lists | Each list holds only what it needs. But "Bought" has to copy data across, a book exists in two shapes, and the dashboards have to merge both. | Not chosen |
| **B. One list of everything, with a status** | "Bought" is a flag flip and the price becomes the paid price. One import pass. Vinyls and games reuse it later. The table gains some book-only fields. | **Chosen by you** |
| C. A separate Books app | Contradicts "one app". | Dropped |

## Data (Approach B), as decided

Migration `supabase/migrations/0003_library.sql`. The user runs it in the SQL editor, as before.

**`items`** (the existing table) gains:

| Column | Notes |
|---|---|
| `collection text` | null = general wishlist item; else `book` or `manga` (check constraint; `vinyl`/`game` added in their rounds) |
| `author text` | |
| `series text`, `series_number numeric` | |
| `genres text[]` | |
| `pages integer` | |
| `language text` | |
| `form text` | Prose, Poetry… free text |
| `rating smallint` | 1–5, null = no rating |
| `bought_on date` | set when Bought is ticked; null = before the app |

It also changes:
- `url` and `store` become **nullable**, because a book from a bookstore has no link.
- `store` now means **where you got it** ("Bertrand", "Gift"), still filled from the link's domain when there is a link.
- `bought` stays and means **owned**.
- `category` (your free-text type) **stays** for general wishlist items.
- Existing wishlist items typed as books move to the Library's wishlist. Names match without regard to case:
  - book/books/livro(s) → `collection = 'book'`, and `category` is cleared
  - manga → `collection = 'manga'`, and `category` is cleared
  - every other type, vinyls and games included, stays as it is

**`reads`** (new), with the same row-level security pattern (one `for all` policy on `user_id = auth.uid()`):

| Column | Notes |
|---|---|
| `id uuid pk` | |
| `user_id uuid not null default auth.uid()` | |
| `item_id uuid not null references items on delete cascade` | |
| `started_on date`, `finished_on date` | |
| `before_app boolean not null default false` | |

A book's reading state, derived:
- **Reading:** it has a read with no `finished_on` and not `before_app`.
- **Read:** it has a read with a `finished_on` or `before_app`.
- **Unread:** owned with no reads.

## Notion import, as decided

Source: the `_all.csv` export (45 real rows; the 5 empty "Owned" rows at the end are skipped).

| Notion | App |
|---|---|
| Book Title, Author | title, author |
| Type: Prose / Manga | collection book (form Prose) / manga |
| Collection / Series, Series Number | series and series_number. "No Collection" or number 0 → none |
| Genre ("Fantasy, Fiction, …") | genres array |
| Pages, Language | pages, language |
| Rating ⭐️ count / "No Rating" / empty | 1–5 / null |
| Bought (store or "Gift") | store |
| Price "€24.90" | price_cents (Gift = 0) |
| Status **Wishlist** (12) | `bought = false`, shown in the Library's wishlist |
| Status **Owned** (1) | `bought = true`, no read |
| Status **Currently Reading** (2) | `bought = true`, a read started on Date Start (MM/DD/YYYY), no finish |
| Status **Finished** (30) | `bought = true`, one `before_app` read |
| Cover file name | `image_url` → the file in a public Supabase Storage bucket `covers`, **if** you upload the images from the Notion zip; else empty, to be filled later with **Find details** |

The import is a small Node script in `scripts/` that reads the CSV and prints the SQL. You paste that SQL into the Supabase SQL editor. It finds your user id with `select id from auth.users limit 1`, since there is one user. The import keeps the €2.90 for Lendários as written.

## What's left to the builder

- Routing: hash routes (e.g. `#/`, `#/wishlist`, `#/library/books`, `#/library/manga`, `#/library/stats`), with no new dependency. GitHub Pages can't rewrite paths, so hash routes are the simple fit.
- How the themes are wired: CSS variables plus one background component per theme are expected. The background SVGs come from the canvas artboards `Books.dc.html` and `Manga.dc.html`.
- Charts: plain CSS/SVG bars are enough. Add a chart library only if a chart really needs one.
- Google Books query and result picking: search by `isbn:` when the input looks like an ISBN, else by title. Show the top 5 with cover, author, year and language.
- Exact empty states, loading states and error copy, in the existing tone.
- Home screen: Emerald Night cards for Wishlist and Library, each with a count (e.g. "12 wanted", "33 books"). **Sign out** moves to Home. Library and Wishlist get a "‹ Collections" back link in the shared header.
- Book modal (add and edit): all book fields plus the dates of the latest read (editable date inputs). Delete asks for confirmation inside the modal, like the wishlist does.
- Unticking Bought (owned → wanted) clears `bought_on` and keeps any reads.

## Calls I made (check these)

1. **Your free types stay.** Collections (Book, Manga) are a separate thing that decides which screen an item lives on, not a replacement for types.
2. **`bought` keeps meaning owned.** The main wishlist keeps its Not bought / Bought toggle for general items. The Library's Shelf | Wishlist switch is the same flag for books and manga.
3. **Purchase date** is recorded from now on, for spending per year. Imported purchases count as "before the app".
4. **Manga volume bar** = owned vs. owned + wanted volumes. For example, Demon Slayer shows **13 / 23**, because volumes 14–23 are on your wishlist. Real series totals (e.g. 41 for Berserk) are left out.
5. **Book lookup uses Google Books**, which is better for Portuguese editions than Open Library. It isn't tested from your setup yet.
6. **Covers from Notion need the images:** you upload the zip's image folder to a Storage bucket once. Without that, covers come from **Find details**, book by book.
7. **Vinyl and Game** get collection screens in their own rounds.
8. **Existing wishlist items typed "Books"/"Livros"/"Manga" move to the Library's wishlist.** Vinyls and games stay in the main Wishlist until their screens exist.
9. **The home screen counts** only general items for Wishlist, and books + manga (owned · wanted) for Library.
