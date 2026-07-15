import type { Metadata } from 'next'

import { LoginClient } from '@/components/store/LoginClient'

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } }

export default function LoginPage() {
  return <LoginClient next="/account" />
}
