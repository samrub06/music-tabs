import { getCachedExploreCatalog } from '@/lib/services/exploreCatalogCache'
import ExploreCatalogResults from './ExploreCatalogResults'

export interface ExploreCatalogParams {
  page: number
  limit: number
  q: string
  genre?: string
  difficulty?: string
  decade?: number
  view: 'gallery' | 'table'
  userId?: string
}

export default async function ExploreCatalogSection({
  page,
  limit,
  q,
  genre,
  difficulty,
  decade,
  view,
  userId,
}: ExploreCatalogParams) {
  const { songs, total } = await getCachedExploreCatalog({
    page,
    limit,
    q,
    genre,
    difficulty,
    decade,
  })

  return (
    <ExploreCatalogResults
      songs={songs}
      total={total}
      page={page}
      limit={limit}
      view={view}
      userId={userId}
    />
  )
}
