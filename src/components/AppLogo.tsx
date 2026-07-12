import Image from 'next/image'
import { cn } from '@/lib/utils'

type AppLogoVariant = 'portrait' | 'text'

interface AppLogoProps {
  variant?: AppLogoVariant
  className?: string
  alt?: string
  priority?: boolean
}

/** Both variants use the chili mark until a dedicated wordmark is provided. */
const LOGO_CONFIG = {
  portrait: { src: '/logo_tabasco.png', width: 40, height: 40 },
  text: { src: '/logo_tabasco.png', width: 40, height: 40 },
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
      className={cn('object-contain', className)}
    />
  )
}
