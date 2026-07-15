'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { Button } from '@/components/ui/button'
import type { SongEditSuggestion } from '@/lib/services/songSuggestionRepo'
import { reviewSongEditSuggestionAction } from '@/app/song/[id]/suggestion-actions'

interface AdminSuggestionsClientProps {
  suggestions: SongEditSuggestion[]
}

export default function AdminSuggestionsClient({
  suggestions,
}: AdminSuggestionsClientProps) {
  const { t } = useLanguage()
  const [pending, startTransition] = useTransition()

  const review = (suggestionId: string, status: 'accepted' | 'rejected') => {
    startTransition(async () => {
      await reviewSongEditSuggestionAction({ suggestionId, status })
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-4 sm:p-6">
      <h1 className="mb-1 text-xl font-semibold text-foreground">
        {t('admin.suggestionsTitle')}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {t('admin.suggestionsHint')}
      </p>

      {suggestions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('admin.suggestionsEmpty')}</p>
      ) : (
        <ul className="space-y-3">
          {suggestions.map((s) => (
            <li
              key={s.id}
              className="rounded-xl border border-border/60 bg-card p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium text-foreground">
                    {s.catalogTitle || s.catalogSongId}
                    {s.catalogAuthor ? (
                      <span className="font-normal text-muted-foreground">
                        {' '}
                        — {s.catalogAuthor}
                      </span>
                    ) : null}
                  </p>
                  {s.message ? (
                    <p className="text-sm text-muted-foreground">{s.message}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {typeof s.createdAt === 'string'
                      ? new Date(s.createdAt).toLocaleString()
                      : s.createdAt.toLocaleString()}
                  </p>
                  <Link
                    href={`/song/${s.fromSongId}`}
                    className="inline-block text-sm font-medium text-primary hover:underline"
                  >
                    {t('admin.suggestionsOpenCopy')}
                    {s.fromSongTitle ? `: ${s.fromSongTitle}` : ''}
                  </Link>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => review(s.id, 'rejected')}
                  >
                    {t('admin.suggestionsReject')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() => review(s.id, 'accepted')}
                  >
                    {t('admin.suggestionsAccept')}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
