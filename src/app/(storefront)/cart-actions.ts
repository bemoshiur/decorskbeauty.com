'use server'

import { revalidatePath } from 'next/cache'

import { addToCart } from '@/lib/commerce/cart'

export async function addToCartAction(formData: FormData) {
  const variantId = Number(formData.get('variantId'))
  if (Number.isFinite(variantId) && variantId > 0) {
    await addToCart(variantId, 1)
  }
  revalidatePath('/checkout')
}
