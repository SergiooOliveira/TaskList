# Collections: roadmap and notes

Status: **ideas agreed, design not written yet.** We pick this up next session, starting with the open questions at the bottom.

## The idea

The wishlist app grows into a home for the things you collect, starting with books, then vinyls and games. It should feel like the wishlist does now (calm, clean, quick on the phone), because Notion does the job but isn't fun.

## What's decided

- **One app.** The same login, database and Emerald Night look. The wishlist becomes one section among several.
- **Home screen.** It shows your collections (Wishlist, Books, Vinyls, Games), and you tap one to open it.
- **The wishlist stays the single place for everything you want.**
  - Wanted books, vinyls and games all show in the wishlist.
  - You can add a wanted item from its own collection page (e.g. from Books), and it lands in the wishlist.
- **Bought → collection.** Ticking "Bought" on a wishlist book moves it into your Books library. The same goes for vinyls and games.
- **You buy books in bookstores.** So the wishlist link becomes **optional** for books, since a book doesn't need a product page.

## Order of work

Each step is usable on its own.

1. **Home screen + Books.** The library (books you own), Bought → library, automatic book details, and yearly reading numbers.
2. **Vinyls.** This reuses the Books pattern, with details from Discogs.
3. **Games.** A dashboard built from your Steam account.
4. **Series suggestions.** When you own book 1 of a series, the app shows the rest with a one-tap "add to wishlist".

## Books: what it should do

- **Your library:** the books you own, each with cover, title, author and page count.
- **Automatic details:** type a title (or an ISBN) and the app fills in cover, author and pages from a free book database (Open Library or Google Books). You can still edit anything by hand.
- **Yearly numbers.** For each year:
  - how many books you read
  - how many pages
  - which books
- **Adding from Books.** You can add a book you want from the Books page, and it goes to the wishlist.

## Findings so far

| Topic | What we know |
|---|---|
| Book details | Free book databases are made for apps to read. Unlike the stores (which blocked us), they should work. **Not tested from your setup yet.** |
| Prices | Can't be filled in automatically: stores block automated reads. Picture, title and author can be. |
| Series | Book databases record series only patchily. Well-known series will usually be detected, not always. |
| Vinyls | Discogs has cover, artist and tracklist. It needs a free Discogs token. |
| Steam | Steam has a free API that lists your games and hours played. It needs a Steam API key (free, requested once on Steam's developer site) and your profile's game details set to public. The key must stay secret, so this needs a small server piece (a Supabase function), like the old price fetcher. |
| Yearly numbers | Each book needs the date you finished it. Pages per year = page count of the books finished that year. |

## Open questions for next session

1. **Reading status.** Owning a book isn't the same as reading it. Which states do you want: *Own, not read yet / Reading / Read*? Do you want to record the start date as well as the finish date?
2. **Re-reads.** If you read a book twice, should it count twice in the yearly numbers?
3. **Notion history.** Do you want to bring your existing Notion reading list in? Notion exports to CSV, and the app could import it once, so the yearly view has your past years from day one.
4. **Yearly view.** What should it look like: plain numbers, a chart per month, covers of the books read that year, a reading goal? (Your visuals will answer most of this.)
5. **What counts as "a book" in the wishlist.** Today an item's type is free text ("Books", "Vinyls"…). Moving bought items to the right collection needs the app to know an item *is* a book. Either the collections become fixed types, or you link your types to collections once.

## Your homework

Visuals for the home screen, the Books library and the yearly view.
