
import { createClient } from '@supabase/supabase-js';
import { trendingService } from '../src/lib/services/trendingService';
import { Database } from '@/types/db';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Erreur: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local');
    process.exit(1);
  }

  console.log('🔌 Initialisation du client Supabase...');
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('🚀 Lancement de la mise à jour des tendances...');
  try {
    // Limiter à 5 chansons pour le test
    const stats = await trendingService.updateTrendingDatabase(supabase, 15);
    console.log('✅ Mise à jour terminée avec succès !');
    console.log('📊 Statistiques :', stats);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour :', error);
  }
}

run();

