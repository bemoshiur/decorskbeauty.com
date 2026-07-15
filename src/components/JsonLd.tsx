import React from 'react'

/**
 * Renders a JSON-LD block. `<` is escaped to < so a stray "</script>" inside any string field
 * can never break out of the tag (the standard structured-data XSS guard).
 */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
