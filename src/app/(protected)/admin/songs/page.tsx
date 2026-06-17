import { Suspense } from 'react'
import AdminSongsData from './AdminSongsData'

export default function AdminSongsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
      <AdminSongsData searchParams={searchParams} />
    </Suspense>
  )
}
