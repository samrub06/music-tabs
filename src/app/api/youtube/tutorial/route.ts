import { searchFirstEmbeddableTutorial } from '@/lib/services/youtubeService'
import { youtubeTutorialSearchSchema } from '@/lib/validation/schemas'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const validated = youtubeTutorialSearchSchema.parse({
      q: searchParams.get('q') ?? '',
      lang: searchParams.get('lang') ?? undefined,
    })

    const video = await searchFirstEmbeddableTutorial(
      validated.q,
      validated.lang
    )

    if (!video) {
      return NextResponse.json(
        { error: 'No embeddable tutorial found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ video })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid search query' }, { status: 400 })
    }

    if (error instanceof Error && error.message === 'YOUTUBE_API_KEY is not configured') {
      return NextResponse.json(
        { error: 'YouTube integration is not configured' },
        { status: 503 }
      )
    }

    console.error('YouTube tutorial search failed:', error)
    return NextResponse.json(
      { error: 'Failed to search YouTube tutorials' },
      { status: 500 }
    )
  }
}
