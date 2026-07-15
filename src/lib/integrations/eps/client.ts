/**
 * EPS (Easy Payment System) client — server-side only. Follows the eps-payment-gateway skill
 * (scripts/nextjs/eps-client.ts) exactly. Never import from a client component.
 *
 * Flow: GetToken (API 1) → InitializeEPS (API 2) → CheckMerchantTransactionStatus (API 3, verify).
 * x-hash = base64(HMAC-SHA512(EPS_HASH_KEY, <per-endpoint param>)). Verify is MANDATORY (#7).
 */
import crypto from 'node:crypto'

function requireEnv(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`Missing env var: ${key}`)
  return v.trim()
}

const BASE_URL = process.env.EPS_MODE === 'sandbox' ? 'https://sandboxpgapi.eps.com.bd' : 'https://pgapi.eps.com.bd'

/** x-hash: HMAC-SHA512(key = EPS_HASH_KEY, message = parameter) → base64. */
export function epsHash(parameter: string, hashKey?: string): string {
  return crypto
    .createHmac('sha512', hashKey ?? requireEnv('EPS_HASH_KEY'))
    .update(parameter, 'utf8')
    .digest('base64')
}

/** Globally unique per merchant, min 10 chars. */
export function generateMerchantTransactionId(prefix = 'TXN'): string {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
}

// --- Status normalizer (handles every documented + observed alias) --------
export type EpsStatus = 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'PENDING' | 'UNKNOWN'

export function normalizeStatus(verified: unknown): EpsStatus {
  const v = (verified ?? {}) as Record<string, unknown> & { data?: Record<string, unknown> }
  const raw = String(
    v.Status ?? v.transactionStatus ?? v.status ?? v.data?.transactionStatus ?? v.data?.status ?? 'UNKNOWN',
  ).toUpperCase()
  if (raw === 'SUCCESS' || raw === 'COMPLETED') return 'SUCCESS'
  if (raw === 'FAILED' || raw === 'FAILURE') return 'FAILED'
  if (raw === 'CANCEL' || raw === 'CANCELED' || raw === 'CANCELLED') return 'CANCELLED'
  if (raw === 'PENDING') return 'PENDING'
  return 'UNKNOWN'
}

// --- Token cache (per-process, in-memory) ---------------------------------
let cachedToken: string | null = null
let cachedTokenExpiresAt = 0

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedTokenExpiresAt - 60_000) return cachedToken

  const userName = requireEnv('EPS_USERNAME')
  const password = requireEnv('EPS_PASSWORD')
  const res = await fetch(`${BASE_URL}/v1/Auth/GetToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-hash': epsHash(userName) },
    body: JSON.stringify({ userName, password }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`EPS GetToken HTTP ${res.status}`)
  const body = (await res.json()) as { token?: string; expireDate?: string; errorCode?: string; errorMessage?: string }
  if (body.errorCode || !body.token) throw new Error(`EPS GetToken: ${body.errorMessage || 'no token'}`)
  cachedToken = body.token
  cachedTokenExpiresAt = new Date(body.expireDate ?? Date.now() + 5 * 60_000).getTime()
  return cachedToken
}

export interface EpsCustomer {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postcode: string
  country?: string
}

export interface InitPaymentInput {
  orderId: string
  amount: number
  customer: EpsCustomer
  ipAddress: string
  productSummary?: string
  merchantTransactionId?: string
  valueA?: string
}

export interface InitPaymentResult {
  redirectUrl: string
  transactionId: string
  merchantTransactionId: string
}

/** API No.2 — create the transaction; returns the hosted-checkout RedirectURL. */
export async function initPayment(opts: InitPaymentInput): Promise<InitPaymentResult> {
  const merchantTransactionId = opts.merchantTransactionId ?? generateMerchantTransactionId()
  const token = await getToken()

  const body = {
    merchantId: requireEnv('EPS_MERCHANT_ID'),
    storeId: requireEnv('EPS_STORE_ID'),
    CustomerOrderId: opts.orderId,
    merchantTransactionId,
    transactionTypeId: 1, // Web
    financialEntityId: 0,
    transitionStatusId: 0,
    totalAmount: Number(opts.amount),
    ipAddress: opts.ipAddress || '0.0.0.0',
    version: '1',
    successUrl: requireEnv('EPS_SUCCESS_URL'),
    failUrl: requireEnv('EPS_FAIL_URL'),
    cancelUrl: requireEnv('EPS_CANCEL_URL'),
    customerName: opts.customer.name,
    customerEmail: opts.customer.email,
    customerAddress: opts.customer.address,
    customerAddress2: '',
    customerCity: opts.customer.city,
    customerState: opts.customer.state,
    customerPostcode: opts.customer.postcode,
    customerCountry: opts.customer.country ?? 'BD',
    customerPhone: opts.customer.phone,
    shipmentName: '',
    shipmentAddress: '',
    shipmentAddress2: '',
    shipmentCity: '',
    shipmentState: '',
    shipmentPostcode: '',
    shipmentCountry: '',
    valueA: opts.valueA ?? '',
    valueB: '',
    valueC: '',
    valueD: '',
    shippingMethod: 'NO',
    noOfItem: '1',
    productName: opts.productSummary ?? 'Order',
    productProfile: 'general',
    productCategory: 'general',
    ProductList: [],
  }

  const res = await fetch(`${BASE_URL}/v1/EPSEngine/InitializeEPS`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hash': epsHash(merchantTransactionId),
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`EPS Initialize HTTP ${res.status}`)
  const data = (await res.json()) as { TransactionId?: string; RedirectURL?: string; ErrorCode?: string | null; ErrorMessage?: string }
  if (data.ErrorCode || !data.RedirectURL) throw new Error(`EPS Initialize: ${data.ErrorMessage || 'no RedirectURL'}`)
  return { redirectUrl: data.RedirectURL, transactionId: data.TransactionId ?? '', merchantTransactionId }
}

export type VerifyResult = { MerchantTransactionId?: string; EpsTransactionId?: string; TotalAmount?: string; FinancialEntity?: string } & Record<
  string,
  unknown
>

/** API No.3 — MANDATORY independent verification. Read-only, safe to call N times (#7, §8.3). */
export async function verifyPayment(args: { merchantTransactionId?: string; epsTransactionId?: string }): Promise<VerifyResult> {
  if (!args.merchantTransactionId && !args.epsTransactionId) {
    throw new Error('verifyPayment needs merchantTransactionId or epsTransactionId')
  }
  const token = await getToken()
  const param = (args.merchantTransactionId ?? args.epsTransactionId)!
  const queryKey = args.merchantTransactionId ? 'merchantTransactionId' : 'EPSTransactionId'
  const res = await fetch(`${BASE_URL}/v1/EPSEngine/CheckMerchantTransactionStatus?${queryKey}=${encodeURIComponent(param)}`, {
    headers: { 'x-hash': epsHash(param), Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`EPS Verify HTTP ${res.status}`)
  return res.json()
}
