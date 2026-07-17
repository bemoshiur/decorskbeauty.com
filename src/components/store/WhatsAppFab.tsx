/** Floating WhatsApp button on every page (redesign — WhatsApp is how BD buyers order). Phone is
 *  admin-driven (falls back to the store number). */
export function WhatsAppFab({
  phone = '8801712113032',
  message = "Hi, I'd like to order from Decor's K-Beauty.",
}: {
  phone?: string
  message?: string
}) {
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Order on WhatsApp"
      className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-celadon-deep"
    >
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden>
        <path d="M17.47 14.38c-.29-.15-1.7-.84-1.97-.94-.26-.1-.46-.15-.65.15-.19.29-.74.94-.91 1.13-.17.19-.34.22-.63.07-.29-.15-1.22-.45-2.33-1.44-.86-.77-1.44-1.72-1.61-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.19-.29.29-.48.1-.19.05-.36-.02-.51-.07-.15-.65-1.57-.89-2.15-.24-.56-.48-.48-.65-.49h-.56c-.19 0-.51.07-.77.36-.26.29-1.01.99-1.01 2.41 0 1.42 1.04 2.79 1.18 2.98.15.19 2.05 3.13 4.96 4.39.69.3 1.23.48 1.65.61.69.22 1.32.19 1.82.11.56-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34zM12.04 21.5h-.01a9.5 9.5 0 0 1-4.83-1.32l-.35-.21-3.59.94.96-3.5-.23-.36a9.46 9.46 0 0 1-1.45-5.05c0-5.24 4.27-9.5 9.5-9.5 2.54 0 4.92.99 6.72 2.78a9.44 9.44 0 0 1 2.78 6.73c0 5.24-4.26 9.49-9.5 9.49zM20.5 3.49A11.44 11.44 0 0 0 12.04.02C5.66.02.48 5.2.48 11.58c0 2.04.53 4.03 1.55 5.79L.38 23.98l6.76-1.77a11.53 11.53 0 0 0 5.5 1.4h.01c6.38 0 11.56-5.18 11.56-11.56 0-3.09-1.2-5.99-3.39-8.18z" />
      </svg>
    </a>
  )
}
