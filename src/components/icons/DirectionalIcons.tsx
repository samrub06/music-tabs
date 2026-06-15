'use client'

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

type IconProps = {
  className?: string
}

/** Back / navigate-up chevron (header, lists). */
export function BackChevronIcon({ className }: IconProps) {
  const { isRtl } = useLanguage()
  const Icon = isRtl ? ChevronRightIcon : ChevronLeftIcon
  return <Icon className={className} aria-hidden />
}

/** Back / previous-page arrow. */
export function BackArrowIcon({ className }: IconProps) {
  const { isRtl } = useLanguage()
  const Icon = isRtl ? ArrowRightIcon : ArrowLeftIcon
  return <Icon className={className} aria-hidden />
}

/** Forward / next-page arrow. */
export function ForwardArrowIcon({ className }: IconProps) {
  const { isRtl } = useLanguage()
  const Icon = isRtl ? ArrowLeftIcon : ArrowRightIcon
  return <Icon className={className} aria-hidden />
}

/** Trailing chevron on list rows (e.g. song suggestions). */
export function ForwardChevronIcon({ className }: IconProps) {
  const { isRtl } = useLanguage()
  const Icon = isRtl ? ChevronLeftIcon : ChevronRightIcon
  return (
    <Icon
      className={cn(
        className,
        'transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5'
      )}
      aria-hidden
    />
  )
}
