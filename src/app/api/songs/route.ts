import { parseTextToStructuredSong } from '@/utils/songParser';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'src/data/sampleData.json');

// GET - Lire toutes les chansons et dossiers
export async function GET() {
  try {
    const fileContents = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    const data = JSON.parse(fileContents);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading data file:', error);
    return NextResponse.json(
      { error: 'Failed to read data' },
      { status: 500 }
    );
  }
}

// POST - Ajouter une nouvelle chanson (convertie automatiquement au format structuré)
export async function POST(request: NextRequest) {
  try {
    const { title, author, content, folderId } = await request.json();
    
    // Lire le fichier actuel
    const fileContents = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    const data = JSON.parse(fileContents);
    
    // Générer un ID unique
    const generateId = () => `song-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Parser le contenu texte vers le format structuré
    const structuredSong = parseTextToStructuredSong(title, author, content, folderId);
    
    // Ajouter l'ID et les timestamps
    const songWithMetadata = {
      ...structuredSong,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Ajouter à la liste
    data.songs.push(songWithMetadata);
    
    // Écrire dans le fichier
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
    
    return NextResponse.json(songWithMetadata, { status: 201 });
  } catch (error) {
    console.error('Error adding song:', error);
    return NextResponse.json(
      { error: 'Failed to add song' },
      { status: 500 }
    );
  }
}
