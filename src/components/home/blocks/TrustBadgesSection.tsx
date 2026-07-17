import type { TrustBadgesBlock } from '@/payload-types'
import { cn } from '@/lib/cn'
import { Section } from '@/components/ui/Section'
import { Icon } from '@/components/ui/Icon'
import { SectionHeading } from '@/components/home/SectionHeading'
import { RevealGroup, RevealItem } from '@/components/motion/Reveal'

/**
 * Compact BD trust bar (Authentic / COD / Delivery / Returns). A responsive row of badges,
 * each an icon in a celadon-tinted disc over a bold label + supporting line. Server component;
 * entrance handled by the <RevealGroup> client island so this file stays SSR.
 */
export function TrustBadgesSection({ block }: { block: TrustBadgesBlock }) {
  const badges = block.badges ?? []
  if (badges.length === 0) return null

  const theme = block.theme ?? 'cloud'
  const onDark = theme === 'ink'

  return (
    <Section surface={theme} spacing="sm">
      {block.heading && (
        <SectionHeading title={block.heading} align="center" onDark={onDark} className="mb-10 sm:mb-12" />
      )}

      <RevealGroup
        as="ul"
        className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4"
      >
        {badges.map((badge, i) => (
          <RevealItem
            as="li"
            key={badge.id ?? i}
            className={cn(
              'group flex flex-col items-center gap-3 rounded-card p-5 text-center transition-shadow duration-300 ease-out-soft sm:p-6',
              onDark
                ? 'bg-white/5 ring-1 ring-white/10 hover:shadow-glow'
                : 'glass ring-soft shadow-soft hover:shadow-lift',
            )}
          >
            <span
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-full ring-1 transition-transform duration-300 ease-out-soft group-hover:scale-105',
                onDark
                  ? 'bg-celadon/20 text-celadon-soft ring-celadon/30'
                  : 'bg-celadon/15 text-celadon-deep ring-celadon/25',
              )}
              aria-hidden
            >
              <Icon name={badge.icon ?? undefined} className="h-6 w-6" />
            </span>

            <span
              className={cn(
                'font-display text-base font-semibold leading-snug sm:text-lg',
                onDark ? 'text-paper' : 'text-ink',
              )}
            >
              {badge.label}
            </span>

            {badge.sub && (
              <span
                className={cn(
                  'line-clamp-2 max-w-[22ch] text-sm leading-relaxed',
                  onDark ? 'text-paper/70' : 'text-grey',
                )}
              >
                {badge.sub}
              </span>
            )}
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  )
}
