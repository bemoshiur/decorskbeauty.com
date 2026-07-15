/** ISR cache tags for catalog reads (§15.3 revalidateTag). */
export const CATALOG_TAG = 'catalog'
export const productTag = (slug: string) => `product:${slug}`
export const categoryTag = (slug: string) => `category:${slug}`
export const brandTag = (slug: string) => `brand:${slug}`
