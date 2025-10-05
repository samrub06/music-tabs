import { importPlaylistFromText, ImportProgress } from '@/lib/services/simplePlaylistImporter';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text: playlistText, targetFolderId, useAiOrganization, useSSE } = body;

    if (!playlistText) {
      return NextResponse.json(
        { error: 'Text content is required for import' },
        { status: 400 }
      );
    }

    // Si SSE demandé, utiliser le streaming
    if (useSSE) {
      return await handleTextImportWithSSE(request, playlistText, targetFolderId, useAiOrganization);
    }

    // Import par texte copié depuis MyTabs (mode normal)
    return await handleTextImport(request, playlistText, targetFolderId, useAiOrganization);

  } catch (error) {
    console.error('Error importing playlist:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to import playlist',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


// Nouvelle fonction pour gérer l'import par texte
async function handleTextImport(request: NextRequest, playlistText: string, targetFolderId?: string, useAiOrganization?: boolean) {
  try {
    // Récupérer le token d'authentification depuis les headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No authentication token found' },
        { status: 401 }
      );
    }

    // Créer un client Supabase avec le token d'auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to import songs', details: authError?.message },
        { status: 401 }
      );
    }

    console.log(`✅ User authenticated: ${user.id} (${user.email})`);

    // Importer la playlist depuis le texte
    const result = await importPlaylistFromText(
      playlistText,
      user.id,
      targetFolderId,
      undefined, // Pas de callback de progression pour l'API
      supabase,
      useAiOrganization
    );

    return NextResponse.json({
      message: 'Playlist import completed',
      results: result
    });

  } catch (error) {
    console.error('Error in text playlist import:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Nouvelle fonction pour gérer l'import par texte avec SSE
async function handleTextImportWithSSE(request: NextRequest, playlistText: string, targetFolderId?: string, useAiOrganization?: boolean) {
  try {
    // Récupérer le token d'authentification depuis les headers
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No authentication token found' },
        { status: 401 }
      );
    }

    // Créer un client Supabase avec le token d'auth
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Please log in to import songs', details: authError?.message },
        { status: 401 }
      );
    }

    console.log(`✅ User authenticated: ${user.id} (${user.email})`);

    // Créer un ReadableStream pour SSE
    const encoder = new TextEncoder();
    let result: any = null;

    const stream = new ReadableStream({
      async start(controller) {
        // Fonction pour envoyer des données SSE
        const sendSSE = (data: any) => {
          console.log('📡 Sending SSE data:', data);
          const sseData = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        };

        // Callback de progression
        const onProgress = (progress: ImportProgress) => {
          console.log('📊 Progress update received:', progress);
          sendSSE({
            type: 'progress',
            data: progress
          });
        };

        try {
          // Lancer l'import avec le callback de progression
          console.log('🚀 Starting import with SSE progress callback...');
          const importResult = await importPlaylistFromText(
            playlistText,
            user.id,
            targetFolderId,
            onProgress,
            supabase,
            useAiOrganization
          );
          
          result = importResult;
          console.log('🎉 Import completed:', result);
          
          // Envoyer le résultat final
          sendSSE({
            type: 'complete',
            data: {
              message: 'Playlist import completed',
              results: result
            }
          });
          
          // Fermer le stream
          controller.close();
        } catch (error) {
          console.error('❌ Import error:', error);
          
          // Envoyer l'erreur
          sendSSE({
            type: 'error',
            data: {
              error: 'Import failed',
              details: error instanceof Error ? error.message : 'Unknown error'
            }
          });
          
          controller.close();
        }
      }
    });

    // Retourner la réponse SSE
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });

  } catch (error) {
    console.error('Error in SSE text playlist import:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
