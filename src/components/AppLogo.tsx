import Image from 'next/image'
import { cn } from '@/lib/utils'

type AppLogoVariant = 'portrait' | 'text'

interface AppLogoProps {
  variant?: AppLogoVariant
  className?: string
  alt?: string
  priority?: boolean
}

const LOGO_CONFIG = {
  portrait: { src: '/logo_tabasco.svg', width: 36, height: 40 },
  text: { src: '/logo_text.svg', width: 140, height: 34 },
} as const

export function AppLogo({
  variant = 'text',
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
      className={cn('w-auto object-contain', className)}
    />
  )
}
