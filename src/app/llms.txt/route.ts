import { llmsTxt } from '@/lib/seo/llms'

export const revalidate = 86400

export function GET() {
  return new Response(llmsTxt(), { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
