import { describe, it, expect } from 'vitest'
import { createHash } from 'crypto'

import { hashField, hashPhone, buildUserData } from '@/lib/integrations/meta/hash'
import { newEventId, buildFbc, buildCapiEvent } from '@/lib/integrations/meta/events'

const sha = (s: string) => createHash('sha256').update(s).digest('hex')

describe('Meta user_data hashing (§13.3, #8)', () => {
  it('hashes normalized (trim+lowercase) SHA-256', () => {
    expect(hashField('  Test@Example.com ')).toBe(sha('test@example.com'))
  })
  it('phone → E.164 without + then SHA-256, regardless of input format', () => {
    const expected = sha('8801712113032')
    expect(hashPhone('01712113032')).toBe(expected)
    expect(hashPhone('+8801712113032')).toBe(expected)
    expect(hashPhone('8801712113032')).toBe(expected)
  })
  it('hashes PII but NEVER fbp/fbc/ip/user_agent', () => {
    const ud = buildUserData({
      email: 'a@b.com',
      phone: '01712113032',
      fbp: 'fb.1.100.PBID',
      fbc: 'fb.1.100.CLID',
      clientIp: '103.12.45.69',
      userAgent: 'Mozilla/5.0',
    })
    expect(ud.em).toHaveLength(64)
    expect(ud.ph).toHaveLength(64)
    expect(ud.fbp).toBe('fb.1.100.PBID') // raw
    expect(ud.fbc).toBe('fb.1.100.CLID') // raw
    expect(ud.client_ip_address).toBe('103.12.45.69') // raw
    expect(ud.client_user_agent).toBe('Mozilla/5.0') // raw
  })
  it('omits absent fields', () => {
    expect(buildUserData({ email: 'a@b.com' })).toEqual({ em: sha('a@b.com') })
  })
})

describe('Meta events (§13.3, §13.6)', () => {
  it('event_id is a unique string', () => {
    const a = newEventId()
    expect(typeof a).toBe('string')
    expect(a).not.toBe(newEventId())
  })
  it('builds fbc as fb.1.{ms}.{fbclid}', () => {
    expect(buildFbc('AbC123', 1700000000000)).toBe('fb.1.1700000000000.AbC123')
  })
  it('CAPI event carries content_ids (=== SKUs, #1), website source, product type', () => {
    const e = buildCapiEvent({
      eventName: 'Purchase',
      eventTimeSec: 1700,
      eventId: 'DKB-2607-00042',
      userData: { em: 'x' },
      value: 1680,
      currency: 'BDT',
      contentIds: ['CRX-921', 'TFS-335'],
    })
    expect(e.action_source).toBe('website')
    expect(e.event_id).toBe('DKB-2607-00042')
    expect((e.custom_data as { content_ids: string[] }).content_ids).toEqual(['CRX-921', 'TFS-335'])
    expect((e.custom_data as { content_type: string }).content_type).toBe('product')
    expect((e.custom_data as { currency: string }).currency).toBe('BDT')
  })
})
