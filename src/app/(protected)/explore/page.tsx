import { createServerClientSupabase } from '@/lib/supabase/server';
import { songRepo } from '@/lib/services/songRepo';
import { folderRepo } from '@/lib/services/folderRepo';
import ExploreClient from './ExploreClient';

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  const supabase = await createServerClientSupabase();
  
  const [trendingSongs, folders] = await Promise.all([
    songRepo(supabase).getTrendingSongs(),
    folderRepo(supabase).getAllFolders()
  ]);

  return (
    <ExploreClient 
      trendingSongs={trendingSongs}
      folders={folders}
    />
  );
}

