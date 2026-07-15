import type { SmsProvider } from './types'
import { segmentCount } from './types'
import { gennetProvider } from './providers/gennet'
import { alphaProvider } from './providers/alpha'

export type { SmsProvider, SmsResult } from './types'
export { normalizeMsisdn, segmentCount } from './types'

const consoleProvider: SmsProvider = {
  name: 'console',
  async send(to, body, opts) {
    // Dev sink — the OTP shows up in the server log.
    console.log(`[SMS→${to}] (${segmentCount(body, opts?.unicode)} seg) ${body}`)
    return { ok: true, provider: 'console', id: 'console', segments: segmentCount(body, opts?.unicode) }
  },
}

/**
 * Resolve the SMS provider from env (§17.3). Falls back to console when the chosen provider isn't
 * fully configured — e.g. GenNet before its base URL is pulled from the panel.
 */
export function getSmsProvider(): SmsProvider {
  const provider = process.env.SMS_PROVIDER || 'console'

  if (provider === 'gennet' && process.env.GENNET_BASE_URL && process.env.GENNET_API_KEY) {
    return gennetProvider({
      baseUrl: process.env.GENNET_BASE_URL,
      apiToken: process.env.GENNET_API_KEY,
      sid: process.env.GENNET_SENDER_ID || 'DecorsKB',
    })
  }
  if (provider === 'alpha' && process.env.ALPHA_SMS_API_KEY) {
    return alphaProvider({ apiKey: process.env.ALPHA_SMS_API_KEY })
  }

  if (provider !== 'console') {
    console.warn(`SMS_PROVIDER=${provider} not fully configured — using console. (Set GENNET_BASE_URL etc.)`)
  }
  return consoleProvider
}
