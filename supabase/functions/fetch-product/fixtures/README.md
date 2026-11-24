# Fixtures (SYNTHETIC)

All files here are SYNTHETIC, hand-written to mimic typical store markup. The
network in the authoring environment blocks fnac.pt, worten.pt and amazon.es, so
real pages could not be captured.

They MUST be replaced by real captures on the first live run (curl with a
browser User-Agent), recording URL, HTTP status and presence of og:image,
og:title and price here, then updating the expected values in `parse.test.ts`.

| File | Shape |
|---|---|
| fnac.html | og:title (with `&amp;`), og:image, JSON-LD `@graph` containing Product, price `179,99` |
| worten.html | broken JSON-LD block, then Product with `offers` array, numeric price |
| amazon.html | no og:title (falls back to `<title>`), product:price:amount meta only |
| blocked.html | captcha / robot check page, no product data |
