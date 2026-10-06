export type VenueAddress = { id: string; slug?: string | null };

/** UUIDs remain internal identifiers and a fallback for pre-migration data. */
export function venuePath(venue: VenueAddress): string {
  return `/lokasi/${venue.slug || venue.id}`;
}