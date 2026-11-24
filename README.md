# Wishlist

A small personal wishlist web app: add items (with product details fetched from a URL), tick them off, and install it on your phone as a PWA.

**Stack:** Vite, React, TypeScript, Vitest, Supabase (auth, Postgres, edge function), GitHub Pages.

## Run locally

```sh
npm install
cp .env.example .env   # fill in your Supabase URL and anon key
npm run dev            # http://localhost:5173/TaskList/
npm test
```

## One-time setup

**Supabase**
1. Create a project and run `supabase/migrations/0001_items.sql` in the SQL editor.
2. Deploy the product fetcher: `npx supabase login`, then `npx supabase link --project-ref <your-project-ref>`, then `npx supabase functions deploy fetch-product`.
3. Under Authentication > URL Configuration, set the Site URL to your GitHub Pages URL and add `http://localhost:5173/TaskList/` and the Pages URL to the redirect URLs.
4. Under Authentication > Email Templates > Magic Link, add `{{ .Token }}` to the email so the 6-digit code appears (needed to sign in from an iPhone home-screen app, which can't receive the link).

**GitHub Pages**
1. Make the repository public.
2. Settings > Pages > Source: "GitHub Actions".
3. Settings > Secrets and variables > Actions > Variables: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (both are public by design).
4. Push to `main`; the workflow tests, builds and deploys. Then open the URL on your phone and choose Add to Home Screen.
