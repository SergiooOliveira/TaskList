# Wishlist

A small personal wishlist web app: paste a product link, fill in the name, price and picture, tick items off when bought, and install it on your phone as a PWA. Typing a lower price later shows the drop (old price struck through, −N% badge). Stores block automated page reads, so details are entered by hand.

**Stack:** Vite, React, TypeScript, Vitest, Supabase (auth, Postgres), GitHub Pages.

## Run locally

```sh
npm install
cp .env.example .env   # fill in your Supabase URL and anon key
npm run dev            # http://localhost:5173/TaskList/
npm test
```

## One-time setup

**Supabase**
1. Create a project and run each file in `supabase/migrations/` in order in the SQL editor.
2. Under Authentication > URL Configuration, set the Site URL to your GitHub Pages URL and add `http://localhost:5173/TaskList/` and the Pages URL to the redirect URLs.
3. Sign-in is by emailed code. Set up custom SMTP (Authentication > Emails > SMTP Settings), then make the Magic Link template body show only the code: `<p>Your sign-in code: <strong>{{ .Token }}</strong></p>`.
4. Optional, for a personal app: Authentication > Sign In / Providers > turn off "Allow new users to sign up" once your own account exists.

**GitHub Pages**
1. Make the repository public.
2. Settings > Pages > Source: "GitHub Actions".
3. Settings > Secrets and variables > Actions > Variables: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (both are public by design).
4. Push to `main`; the workflow tests, builds and deploys. Then open the URL on your phone and choose Add to Home Screen.
