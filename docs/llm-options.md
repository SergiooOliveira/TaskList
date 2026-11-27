# Finding books the search can't find: your options

The problem: Google Books doesn't know some books, especially Portuguese editions. When it does find them, the data is often split across results: one has the cover, another has the title.

Tonight's build already does option 1. The other options can be added on top of it, so you don't have to pick just one.

## 1. Several free sources merged (built tonight)

**How it works:** Every "Find details" now runs several searches at once:

- Google Books, with and without the author;
- Google Books by series and number;
- Google Books limited to your language;
- Open Library.

Duplicate results are merged, so the title comes from one result and the cover from another. The best match is shown first.

| | |
|---|---|
| Cost | Free |
| Setup | None, it's live |
| Good | No key or server needed. Instant. The data is real: ISBNs and covers are never made up. |
| Bad | A book in neither database still can't be found. Portuguese coverage is patchy in both. |

## 2. ISBN barcode scanning

**How it works:** Point the phone camera at the barcode on the back of the book. An ISBN search is the most exact search both databases have.

| | |
|---|---|
| Cost | Free |
| Setup | No key needed. About a day of work. Android Chrome can read barcodes natively (`BarcodeDetector`); other browsers would need a small library. |
| Good | The best accuracy for books you own. It's fast: scan, then pick. |
| Bad | It's no help for wishlist books you don't have in hand. If the ISBN isn't in either database, you still get nothing. |

## 3. An AI that searches the web (Claude with web search)

**How it works:** When the normal search comes up empty, a "Ask AI" button sends the series, number, author and language to Claude. Claude searches the web (publisher sites, Bertrand, Wook, Goodreads) and returns the title, ISBN, page count, summary and a cover link as structured JSON.

To guard against made-up answers, the app then checks the ISBN against Google Books and Open Library. If neither knows it, the result is marked "unverified".

**Setup:** The key must not be in the app, because anyone could read it from the public site. Instead:

1. Create an account at console.anthropic.com, add a few euros of credit, and set a monthly spend limit, for example €5. Your claude.ai subscription doesn't cover the API.
2. Store the key as a Supabase secret (`supabase secrets set ANTHROPIC_API_KEY=…`).
3. Use a small Supabase Edge Function, which I write. It:
   - only answers your logged-in account;
   - calls Claude;
   - returns the JSON.

**Cost per lookup** (current prices, as an estimate). Most of the cost is the web pages the AI reads:

| Model | Price per million tokens (in / out) | One lookup (1–2 searches) |
|---|---|---|
| Claude Haiku 5.5 (cheapest) | $0.10 / $0.50 | ~$0.02, mostly the search fee |
| Claude Sonnet 5.5 (smarter, better with Portuguese sources) | $2 / $10 | ~$0.05–0.08 |

Web search itself costs about $10 per 1,000 searches, on top of the tokens. Check the current figure on Anthropic's pricing page.

At 50 lookups a month, the total is about **€1–4**.

| | |
|---|---|
| Good | It finds books no database has. It understands "the 3rd Legendborn book in Portuguese". |
| Bad | It costs money, takes 5–20 s per lookup, and needs an account and a key. It can still be wrong, so it must be verified. A cover link it finds may be hotlink-blocked. |

## 4. AI without web search (query rewriting only)

**How it works:** The AI only answers questions like "what is the Portuguese title of Harry Potter book 5, and who published it?" The app then runs the normal free search with that title.

| | |
|---|---|
| Cost | About €0.001 per lookup with Haiku 5.5 |
| Setup | Same as option 3 |
| Good | Very cheap and fast. Fixes "I don't know the exact title". |
| Bad | It only knows what it learned in training, which misses recent or niche editions. It must never be trusted for ISBNs or covers, only for the title. |

## 5. Other book databases

- **ISBNdb:** a large paid database, from about $15 a month. Too expensive for one person.
- **Portuguese bookstore sites (Wook, Bertrand):** they have no public API. Scraping them breaks easily and is against their terms. Not recommended.
- **Typing it in yourself:** always possible. Option 1 already pre-fills whatever it found.

## Recommendation

1. **Use option 1 for a week** (it's free and live). Note the books it still misses.
2. If those are mostly books you own, **add option 2 (barcode scanning)**. It's free and exact.
3. If wishlist books are still missing, **add option 3 with Haiku 5.5** behind an "Ask AI" button. It's the fallback, not the default. Set a €5 spend limit so it can never surprise you.

If you choose option 3, I need these from you:

- the Anthropic API key, which you set yourself as a Supabase secret (never paste it in the chat);
- an OK to deploy one Edge Function.
