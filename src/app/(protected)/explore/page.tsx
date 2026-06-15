import { exploreMetadata } from '@/lib/seo/metadata'
import { createSafeServerClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import ExploreClient from './ExploreClient'
import ExploreCatalogSection from './ExploreCatalogSection'
import ExploreCatalogSkeleton from './ExploreCatalogSkeleton'

export const metadata: Metadata = exploreMetadata

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    view?: string
    limit?: string
    q?: string
    genre?: string
    difficulty?: string
    decade?: string
  }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params?.page || '1', 10))
  const limit = Math.max(1, parseInt(params?.limit || '24', 10))
  const view = (params?.view === 'table' ? 'table' : 'gallery') as 'gallery' | 'table'
  const q = params?.q || ''
  const genre = params?.genre || undefined
  const difficulty = params?.difficulty || undefined
  const decade = params?.decade ? parseInt(params.decade, 10) : undefined

  const supabase = await createSafeServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const catalogKey = `${page}:${limit}:${q}:${genre ?? ''}:${difficulty ?? ''}:${decade ?? ''}:${view}`

  return (
    <ExploreClient
      initialView={view}
      initialQuery={q}
      limit={limit}
    >
      <Suspense key={catalogKey} fallback={<ExploreCatalogSkeleton view={view} />}>
        <ExploreCatalogSection
          page={page}
          limit={limit}
          q={q}
          genre={genre}
          difficulty={difficulty}
          decade={decade}
          view={view}
          userId={user?.id}
        />
      </Suspense>
    </ExploreClient>
  )
}
