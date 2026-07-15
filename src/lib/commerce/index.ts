// src/lib/commerce — the ONLY path the storefront reads catalog data through (§3).
export {
  listProductCards,
  getProductBySlug,
  getActiveVariants,
  getPublishedProductSlugs,
  effectivePrice,
  type ProductCard,
} from './products'
export { CATALOG_TAG, productTag, categoryTag, brandTag } from './tags'
export {
  getFefoLotForVariant,
  verifyBatch,
  type FefoLotView,
  type BatchVerification,
} from './lots'
