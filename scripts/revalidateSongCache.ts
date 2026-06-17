export async function revalidateSongCache(songId: string): Promise<void> {
  try {
    const { revalidatePath, revalidateTag } = await import('next/cache')
    revalidateTag(`song-${songId}`)
    revalidatePath(`/song/${songId}`)
  } catch {
    // No-op when run outside the Next.js runtime (e.g. standalone seed scripts).
  }
}
