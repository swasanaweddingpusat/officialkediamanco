# Architecture rules

- Venue URLs use persisted unique slugs through `venuePath`; UUID URLs resolve to the same venue and redirect client-side, while related queries always use UUIDs to preserve booking relationships.
- Portfolio and promotion URLs use shared path helpers with database-generated unique stable slugs; legacy UUID routes resolve and replace to slug URLs, retaining query strings and anchors to preserve existing links.
- Generate venue slugs on insertion in the database and keep them stable across name edits so existing public addresses do not break.
- Scope Editorial Luxe tokens and typography to the venue detail wrapper so other site pages retain their existing design.
- Load external fonts through document head links, never CSS imports, to avoid compiler-dependent remote import failures.
- Apply public editorial styling through the shared Layout wrapper, excluding venue details to preserve their scoped visual system and admin pages to preserve editing controls.