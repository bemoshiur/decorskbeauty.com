// src/lib/commerce — the ONLY path the storefront reads catalog data through (§3).
export {
  listProductCards,
  getProductBySlug,
  getActiveVariants,
  getPublishedProductSlugs,
  listFeaturedProducts,
  listBestSellers,
  listProductCardsByIds,
  effectivePrice,
  type ProductCard,
} from './products'
export { getSiteSettings, getHomepage, listFeaturedCategories } from './content'
export { listApprovedTestimonials } from './testimonials'
export {
  listApprovedReviews,
  getReviewSummary,
  summarize,
  hasPurchasedProduct,
  EMPTY_SUMMARY,
  type ReviewCard,
  type ReviewSummary,
  type RatingKey,
} from './reviews'
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
export { CATALOG_TAG, CONTENT_TAG, productTag, categoryTag, brandTag } from './tags'
export {
  getFefoLotForVariant,
  verifyBatch,
  type FefoLotView,
  type BatchVerification,
} from './lots'
