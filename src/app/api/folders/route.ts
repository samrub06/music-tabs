import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'src/data/sampleData.json');

// POST - Ajouter un nouveau dossier
export async function POST(request: NextRequest) {
  try {
    const newFolder = await request.json();
    
    // Lire le fichier actuel
    const fileContents = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    const data = JSON.parse(fileContents);
    
    // Générer un ID unique
    const generateId = () => `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Créer le nouveau dossier avec métadonnées
    const folderWithMetadata = {
      ...newFolder,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Ajouter à la liste
    data.folders.push(folderWithMetadata);
    
    // Écrire dans le fichier
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
    
    return NextResponse.json(folderWithMetadata, { status: 201 });
  } catch (error) {
    console.error('Error adding folder:', error);
    return NextResponse.json(
      { error: 'Failed to add folder' },
      { status: 500 }
    );
  }
}
