# Architecture rules

- Venue URLs use persisted unique slugs through `venuePath`; UUID URLs resolve to the same venue and redirect client-side, while related queries always use UUIDs to preserve booking relationships.
- Portfolio and promotion URLs use shared path helpers with database-generated unique stable slugs; legacy UUID routes resolve and replace to slug URLs, retaining query strings and anchors to preserve existing links.
- Generate venue slugs on insertion in the database and keep them stable across name edits so existing public addresses do not break.
- Scope Editorial Luxe tokens and typography to the venue detail wrapper so other site pages retain their existing design.
- Load external fonts through document head links, never CSS imports, to avoid compiler-dependent remote import failures.
- Apply public editorial styling through the shared Layout wrapper, excluding venue details to preserve their scoped visual system and admin pages to preserve editing controls.
- Enforce active-only public video testimonial reads through RLS, with a separate user_roles-backed admin read policy, so unpublished videos remain private without blocking CMS management.
- Scope journal palette and reading typography to article pages and share masthead, metadata, sharing, and sidebar elements between listing and detail, so their magazine presentation stays consistent without restyling other pages.
- Split page routes and load concierge and booking form code on interaction so public visitors do not download administrative editors, charts, or chat renderers on arrival.
- Serve CMS public storage images through the shared responsive CMSImage helper, with original URL fallback, so image downloads match display size without changing stored originals.
- Prefer immutable CDN WebP renditions for known public homepage images keyed by exact source URL, with CMS transformations for new URLs, so cache lifetimes improve without altering original storage files.
- Use bounded portfolio preview queries on the home page and invalidate them after CMS mutations so galleries and long biographies are not downloaded for four showcase tiles.
- Use useArticlePreviews for public article lists and keep full article reads for detail and CMS editing so list navigation does not download every article body.
- Generate a public active-hero snapshot before dev/build and use it for initial hero data and matching home-only image preload; live CMS refetches preserve editing updates without delaying first paint.
- Load the home date picker only when opened and start hero rotation after interaction so initial downloads and slide changes do not delay the first viewport.
