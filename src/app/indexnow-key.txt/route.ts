/** IndexNow key file (§14.1). Referenced as keyLocation in the ping; 404 until INDEXNOW_KEY is set. */
export function GET() {
  const key = process.env.INDEXNOW_KEY
  if (!key) return new Response('Not found', { status: 404 })
  return new Response(key, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
