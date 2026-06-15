'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ExploreHubCtaProps {
  className?: string
}

export function ExploreHubCta({ className }: ExploreHubCtaProps) {
  const { t } = useLanguage()

  return (
    <div className={cn('mt-1 mb-6', className)}>
      <Button asChild variant="outline" className="min-h-[44px] w-full">
        <Link href="/explore">{t('library.hubSeeAllExplore')}</Link>
      </Button>
    </div>
  )
}
