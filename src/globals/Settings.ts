import type { GlobalConfig } from 'payload'

/**
 * Store settings (§4.5). VAT is DELIBERATELY not configured (§12.4 / §21): `vatRatePercent` stays 0
 * and postings book 0 to 2020 VAT payable until Moshiur confirms the rate + the correct Mushak form
 * with the VAT consultant. Do not hardcode a rate anywhere else — the posting rules read it here.
 * Seller identity feeds the Mushak-compliant invoice (§12.4; the PDF layout is deferred with §11.2).
 */
export const Settings: GlobalConfig = {
  slug: 'settings',
  admin: { group: 'Config' },
  access: { read: () => true, update: ({ req }) => Boolean(req.user) },
  fields: [
    {
      name: 'vatRatePercent',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: '⚠ VAT NOT CONFIGURED. Stays 0 until the rate + Mushak form are confirmed with the VAT consultant (§12.4). Do not guess.',
      },
    },
    { name: 'vatInclusive', type: 'checkbox', defaultValue: false, admin: { description: 'Are catalog prices VAT-inclusive? Confirm with the consultant.' } },
    { name: 'mushakForm', type: 'text', defaultValue: 'Mushak 6.3', admin: { description: 'Invoice form label (§12.4) — switchable without a code change.' } },
    {
      name: 'seller',
      type: 'group',
      admin: { description: 'Printed on the invoice (§12.4).' },
      fields: [
        { name: 'name', type: 'text', defaultValue: "Decor's K-Beauty" },
        { name: 'address', type: 'textarea', defaultValue: 'Flat B5, House 32-34, Road 7, Block C, Banani, Dhaka 1212' },
        { name: 'bin', type: 'text', admin: { description: 'BIN — required on a Mushak invoice. Add before go-live.' } },
        { name: 'phone', type: 'text', defaultValue: '+8801712113032' },
      ],
    },
    {
      name: 'returns',
      type: 'group',
      admin: { description: 'Drives hasMerchantReturnPolicy in Product JSON-LD (§14.2). Structured data must match the REAL policy — a wrong policy risks a Google manual action. Confirm before go-live.' },
      fields: [
        { name: 'returnsAccepted', type: 'checkbox', defaultValue: true, admin: { description: 'Uncheck if opened cosmetics are non-returnable → emits MerchantReturnNotPermitted.' } },
        { name: 'returnWindowDays', type: 'number', defaultValue: 3, admin: { description: 'Days to return a damaged/wrong item.' } },
      ],
    },
  ],
}
