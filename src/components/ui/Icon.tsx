import {
  ShieldCheck, BadgeCheck, Truck, RotateCcw, Headphones, Sparkles, Leaf, Lock, Star, Heart,
  PackageCheck, Phone, MessageCircle, Music2, Camera, Play, Share2, Globe, type LucideProps,
} from 'lucide-react'

const MAP: Record<string, React.ComponentType<LucideProps>> = {
  'shield-check': ShieldCheck,
  'badge-check': BadgeCheck,
  truck: Truck,
  'rotate-ccw': RotateCcw,
  headphones: Headphones,
  sparkles: Sparkles,
  leaf: Leaf,
  lock: Lock,
  star: Star,
  heart: Heart,
  'package-check': PackageCheck,
  phone: Phone,
  // socials (this lucide build dropped brand glyphs — use recognizable generics)
  facebook: Share2,
  instagram: Camera,
  youtube: Play,
  whatsapp: MessageCircle,
  tiktok: Music2,
  globe: Globe,
}

/** Render a curated lucide icon by admin-selected string name. Falls back to sparkles. */
export function Icon({ name, className, ...props }: { name?: string | null } & LucideProps) {
  const C = (name && MAP[name]) || Sparkles
  return <C className={className} aria-hidden {...props} />
}
