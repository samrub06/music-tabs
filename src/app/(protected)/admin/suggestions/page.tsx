import { Suspense } from 'react'
import AdminSuggestionsData from './AdminSuggestionsData'

export default function AdminSuggestionsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Loading...</div>}>
      <AdminSuggestionsData />
    </Suspense>
  )
}
