// src/lib/commerce — the ONLY path the storefront reads catalog data through (§3).
export {
  listProductCards,
  getProductBySlug,
  getActiveVariants,
  getPublishedProductSlugs,
  effectivePrice,
  type ProductCard,
} from './products'
export {
  computeCheckoutTerms,
  DELIVERY_CHARGE,
  FREE_SHIPPING_MIN_SUBTOTAL,
  ZONE_LABEL,
  type Zone,
  type CartForTerms,
  type CheckoutTerms,
} from './checkout'
export { listIngredients, getIngredientBySlug, getIngredientSlugs } from './ingredients'
export { getRelatedProducts } from './related'
export { CATALOG_TAG, productTag, categoryTag, brandTag } from './tags'
export {
  getFefoLotForVariant,
  verifyBatch,
  type FefoLotView,
  type BatchVerification,
} from './lots'
