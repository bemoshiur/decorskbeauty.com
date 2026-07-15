import { llmsFullTxt } from '@/lib/seo/llms'

export const revalidate = 21600

export async function GET() {
  return new Response(await llmsFullTxt(), { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
