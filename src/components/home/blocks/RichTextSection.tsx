import { RichText } from '@payloadcms/richtext-lexical/react'
import type { RichTextBlock } from '@/payload-types'
import { cn } from '@/lib/cn'
import { Section } from '@/components/ui/Section'
import { Reveal } from '@/components/motion/Reveal'

/**
 * Editorial long-form section rendered from a Payload Lexical richText field.
 * Server component — the only motion comes from the <Reveal> client island so the
 * prose itself streams as SSR HTML. Renders nothing when there is no content.
 */
export function RichTextSection({ block }: { block: RichTextBlock }) {
  // Empty richText fields still serialize a root node; guard on the actual paragraphs.
  const hasContent = Boolean(block.content?.root?.children?.length)
  if (!hasContent) return null

  const onDark = block.theme === 'ink'
  const center = block.align === 'center'

  return (
    <Section surface={block.theme ?? 'paper'} containerSize="narrow">
      <Reveal
        className={cn(
          // Layout + base body voice
          'max-w-3xl text-base leading-relaxed sm:text-lg',
          center ? 'mx-auto text-center' : 'text-left',
          onDark ? 'text-paper/75' : 'text-ink-soft',

          // Collapse the outer margins so the section spacing owns the top/bottom rhythm
          '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',

          // Headings — editorial serif, tight tracking, strong contrast
          '[&_h1]:font-display [&_h1]:mb-4 [&_h1]:mt-12 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:leading-[1.12] [&_h1]:tracking-tight sm:[&_h1]:text-4xl',
          '[&_h2]:font-display [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-[1.15] [&_h2]:tracking-tight sm:[&_h2]:text-3xl',
          '[&_h3]:font-display [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight sm:[&_h3]:text-2xl',
          '[&_h4]:font-display [&_h4]:mb-2 [&_h4]:mt-6 [&_h4]:text-lg [&_h4]:font-semibold',
          onDark
            ? '[&_h1]:text-paper [&_h2]:text-paper [&_h3]:text-paper [&_h4]:text-paper'
            : '[&_h1]:text-ink [&_h2]:text-ink [&_h3]:text-ink [&_h4]:text-ink',

          // Body paragraphs (block margins collapse → even 20px rhythm)
          '[&_p]:my-5',

          // Emphasis
          onDark ? '[&_strong]:text-paper' : '[&_strong]:text-ink',
          '[&_strong]:font-semibold [&_em]:italic',

          // Links — celadon, generous underline offset, subtle → firm on hover
          '[&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4 [&_a]:transition-colors',
          onDark
            ? '[&_a]:text-celadon-soft [&_a]:decoration-celadon-soft/40 hover:[&_a]:decoration-celadon-soft'
            : '[&_a]:text-celadon-deep [&_a]:decoration-celadon/40 hover:[&_a]:decoration-celadon-deep',

          // Lists
          '[&_ul]:my-5 [&_ul]:list-disc [&_ol]:my-5 [&_ol]:list-decimal',
          center ? '[&_ul]:list-inside [&_ol]:list-inside' : '[&_ul]:pl-6 [&_ol]:pl-6',
          '[&_li]:my-1.5 [&_li]:pl-1',
          onDark ? '[&_ul]:marker:text-celadon-soft [&_ol]:marker:text-celadon-soft' : '[&_ul]:marker:text-celadon [&_ol]:marker:text-celadon',

          // Blockquote — celadon rule, serif, quiet italic
          '[&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-celadon [&_blockquote]:pl-5 [&_blockquote]:font-display [&_blockquote]:text-lg [&_blockquote]:italic',
          onDark ? '[&_blockquote]:text-paper/90' : '[&_blockquote]:text-ink',

          // Inline + block code — mono for batch codes / SKU-style snippets
          '[&_code]:rounded-[6px] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]',
          onDark ? '[&_code]:bg-paper/10 [&_code]:text-celadon-soft' : '[&_code]:bg-mist [&_code]:text-celadon-deep',

          // Divider
          '[&_hr]:my-10 [&_hr]:border-t [&_hr]:border-line',
        )}
      >
        <RichText data={block.content as never} />
      </Reveal>
    </Section>
  )
}
