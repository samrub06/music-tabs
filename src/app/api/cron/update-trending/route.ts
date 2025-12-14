import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { trendingService } from '@/lib/services/trendingService';
import { Database } from '@/types/db';

// Utiliser le client Service Role pour contourner RLS (écriture système)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    // Vérification basique d'autorisation (Header 'Authorization': 'Bearer CRON_SECRET')
    // Pour Vercel Cron, on peut vérifier d'autres headers, mais simple secret est ok
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not defined');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Starting trending songs update by categories...');
    const stats = await trendingService.updateTrendingDatabaseByCategories(supabase, 15);
    
    return NextResponse.json({
      success: true,
      message: 'Trending songs updated successfully by categories',
      stats
    });

  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

