type ContentAddress = { id: string; slug?: string | null };

export const isUuidAddress = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export const portfolioPath = (item: ContentAddress) => `/portfolio/${item.slug || item.id}`;
export const promotionPath = (item: ContentAddress) => `/tentang-kami/${item.slug || item.id}`;