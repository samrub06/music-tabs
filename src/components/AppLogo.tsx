import Image from 'next/image'
import { cn } from '@/lib/utils'

type AppLogoVariant = 'portrait' | 'text'

interface AppLogoProps {
  variant?: AppLogoVariant
  className?: string
  alt?: string
  priority?: boolean
}

/** Chili mark + wordmark (transparent PNGs — no white plate). */
const LOGO_CONFIG = {
  portrait: { src: '/logo_tabasco.png', width: 2000, height: 2000 },
  text: { src: '/logo_tabasco_text.png', width: 1000, height: 400 },
} as const

export function AppLogo({
  variant = 'portrait',
  className,
  alt = 'TABasco',
  priority = false,
}: AppLogoProps) {
  const config = LOGO_CONFIG[variant]

  return (
    <Image
      src={config.src}
      alt={alt}
      width={config.width}
      height={config.height}
      priority={priority}
      className={cn('bg-transparent object-contain', className)}
    />
  )
}
