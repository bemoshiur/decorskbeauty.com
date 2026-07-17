import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="mesh-mint">
      <div className="mx-auto flex min-h-[62vh] max-w-xl flex-col items-center justify-center px-6 py-24 text-center">
        <p className="font-mono text-sm font-semibold text-celadon-deep">404</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-ink">Page not found</h1>
        <p className="mt-3 text-ink-soft">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/">Back home</Button>
          <Button href="/search" variant="secondary">Shop all products</Button>
        </div>
      </div>
    </div>
  )
}
