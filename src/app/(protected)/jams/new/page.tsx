import { redirect } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { createSafeServerClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import PlaylistData from './PlaylistData';

export default async function PlaylistPage() {
  noStore();
  const supabase = await createSafeServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50"><div className="max-w-7xl mx-auto px-4 py-8"><div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div></div></div>}>
      <PlaylistData />
    </Suspense>
  );
}

