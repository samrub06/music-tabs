import { unstable_noStore as noStore } from 'next/cache'
import OnboardingClient from './OnboardingClient'

interface OnboardingPageProps {
  searchParams: Promise<{ invite?: string }>
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  noStore()
  const { invite } = await searchParams

  return <OnboardingClient inviteCode={invite?.toUpperCase() ?? null} />
}
