'use client'

import { cn } from '@/lib/utils'

type FolderShapeProps = {
  className?: string
  count?: number
}

function getCountFontSize(count: number): string {
  const digits = String(count).length
  if (digits >= 4) return 'text-[8px] sm:text-[9px]'
  if (digits >= 3) return 'text-[9px] sm:text-[10px]'
  if (digits >= 2) return 'text-[10px] sm:text-xs'
  return 'text-xs sm:text-sm'
}

/** Classic file-folder silhouette (tab + body), wider than tall. */
export function FolderShape({ className, count }: FolderShapeProps) {
  return (
    <div className="relative w-full">
      <svg
        viewBox="0 0 88 72"
        className={cn('aspect-[11/9] h-auto w-full text-primary', className)}
        aria-hidden
      >
        <path
          d="M8 26C8 22.686 10.686 20 14 20H34C36.2 20 38.1 21.3 39.2 23.2H70C74.418 23.2 78 26.782 78 31.2V58C78 62.418 74.418 66 70 66H14C9.582 66 6 62.418 6 58V26H8Z"
          fill="currentColor"
          fillOpacity={0.22}
          stroke="currentColor"
          strokeOpacity={0.38}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <path
          d="M6 31H78"
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={1}
        />
      </svg>
      {count !== undefined && (
        <span
          className={cn(
            'pointer-events-none absolute inset-0 flex items-center justify-center pt-[20%] font-bold tabular-nums text-primary',
            getCountFontSize(count)
          )}
          aria-hidden
        >
          {count}
        </span>
      )}
    </div>
  )
}
