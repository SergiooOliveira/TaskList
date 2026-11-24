# Wishlist app — design

## Why

A personal wishlist of things to buy, gathered from different stores (Fnac, Worten, Amazon, and others), that stays in sync across phone and computer. It should also say when something goes on sale. It's a learning project too: built with React, a framework employers ask for.

## Goals (first version)

- **Add by link.** Paste a product URL. The app fetches the picture, name and price and shows the item. Anything it can't fetch, the user types or pastes by hand.
- **Item list.** Each row shows the picture, name, a store chip (from the link's domain), the price, and a "Bought" checkbox.
- **Filter.** A two-way toggle at the top: *Not bought* (default) / *Bought*.
- **Price drops.** A "Check prices" button fetches the current price of every not-bought item. When the price went down, the row shows `€new`, the old price struck through, and a `−N%` badge.
- **Edit and delete** an item (fix the name, price or picture when the fetch got them wrong).
- **Cloud sync and login**, so the same list shows on every device.
- **Installable** on the phone's home screen (a web app, not a store app).
- **The look** below.

## Non-goals (for now)

- Sharing lists with other people.
- Automatic daily price checks and email alerts. These come in step 2 and reuse the same price fetch, run on a timer.
- Multiple lists, tags, notes, currencies other than EUR, offline editing.

## Anti-goals

- Price fetching must never block adding an item. If a store blocks it, the item is still saved and the user fills in the gaps.
- The flowers must never make the list hard to read or the app feel slow.

## Approaches considered

| | Trade-off |
|---|---|
| **A. React + Supabase** (chosen) | React is lighter to learn and the user has some contact with it. Supabase is free with no card and gives a Postgres database, login, server functions, and (for step 2) a scheduler. |
| B. Angular + Firebase | Equally good for the CV, and strong in Portuguese corporate jobs. But Angular is steeper to start, and Firebase server functions need the pay-as-you-go plan. |
| C. Next.js | React plus server concepts at the same time is a lot for a learner, and it still needs a database from elsewhere. |

The user picked A.

## Look

The approved mock is in [`2026-11-24-wishlist-look.html`](2026-11-24-wishlist-look.html). Copy colors and the floral SVGs from it.

- **Palette: Emerald Night** (dark only). Background `#0F1D17`, surface `#18302A`, text `#E6F2EA`, muted `#86A898`, accent `#4FB287`, highlight `#21463A`, sale `#9FE0B8`.
- **Type:** Space Grotesk for headings, Inter for text.
- **Background, back to front:** two slowly breathing emerald glows (top-left, bottom-right), then three swaying vines in the bottom-right and one in the top-left (each at its own speed), then a few slowly falling petals, then the list. Item rows are slightly see-through with a light blur.
- All motion stops when the device asks for reduced motion.

## How it's built (decided)

- **React + Supabase.**

## Builder's calls (proposed by Claude; the user can override)

- **Vite + React + TypeScript.** TypeScript because job postings expect it alongside React.
- **Login:** Supabase email magic link (no passwords to manage).
- **Data:** one `items` table, with row-level security so each user sees only their own rows:
  `id, user_id, url, title, image_url, store, price_cents, previous_price_cents, price_checked_at, bought, created_at`.
  `store` is the URL's hostname without `www.` (for example `worten.pt`). `previous_price_cents` is set only when a check finds a lower price than `price_cents`. The row then shows the drop until the next check finds a different price.
- **Product fetch:** one Supabase Edge Function, `fetch-product(url)`. It accepts only `http`/`https` URLs, downloads the page with a normal browser User-Agent, and reads:
  - picture: `og:image`
  - name: `og:title`, falling back to `<title>`
  - price: JSON-LD `Product.offers.price`, falling back to the `product:price:amount` meta tag

  It returns whatever it found (any field may be empty). The page itself never fetches store sites, because browsers block that.
- **Check prices:** the client calls `fetch-product` for each not-bought item, one at a time, and updates prices. A failure on one item is shown on that row and doesn't stop the rest.
- **Images:** shown straight from the store's image URL. Shortcut: if a store blocks hotlinking, copy images into Supabase Storage.
- **Hosting:** Vercel free tier for the web app.
- **Install:** a web app manifest and icons. No offline mode.
- **Tests:** Vitest unit tests for the HTML parsing (picture, name and price extraction), using saved sample pages. This is the part most likely to break.

## Risks and things to verify first

- **Amazon** often blocks server requests or returns a captcha page. Expect manual entry for Amazon. The first task should run `fetch-product` on one real Fnac, Worten and Amazon link and record what each returns.
- Store page layouts change over time. The parser tests catch regressions on the saved sample pages, not on live sites.
- `fetch-product` downloads any URL it is given. Only logged-in users may call it, and it rejects non-http(s) schemes. It does not block private IP addresses (low risk on Supabase's hosted functions, but worth noting).

## Step 2 (later, not in this build)

A daily Supabase scheduled job runs the same price check for every user, plus an email when a price drops.
