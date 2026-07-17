/** ISR cache tags for catalog reads (§15.3 revalidateTag). */
export const CATALOG_TAG = 'catalog'
/** ISR cache tag for admin-managed marketing content (homepage blocks, site settings, testimonials). */
export const CONTENT_TAG = 'content'
export const productTag = (slug: string) => `product:${slug}`
export const categoryTag = (slug: string) => `category:${slug}`
export const brandTag = (slug: string) => `brand:${slug}`
