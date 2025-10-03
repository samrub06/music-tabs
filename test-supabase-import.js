// Test script pour vérifier l'import dans Supabase
// Ce script simule l'import d'une chanson dans la base de données

const testSong = {
  title: "Test Song - Viva La Vida",
  author: "Coldplay", 
  content: `Intro: Am F C G

Verse 1:
Am           F              C              G
I used to rule the world, seas would rise when I gave the word
Am           F              C              G
Now in the morning I sleep alone, sweep the streets I used to own

Chorus:
F                C              Am               G
I used to roll the dice, feel the fear in my enemy's eyes
F                C              Am               G
Listen as the crowd would sing, now the old king is dead long live the king

Verse 2:
Am           F              C              G
One minute I held the key, next the walls were closed on me
Am           F              C              G
And I discovered that my castles stand upon pillars of salt and pillars of sand`,
  source: "Ultimate Guitar Test",
  url: "https://tabs.ultimate-guitar.com/tab/coldplay/viva-la-vida-official-1910847"
};

console.log('🧪 Test d\'import dans Supabase...');
console.log('📝 Chanson de test:', testSong.title, 'par', testSong.author);

// Simuler l'appel à l'API
async function testSupabaseImport() {
  try {
    console.log('📡 Appel à l\'API /api/playlists/import...');
    
    // Test avec une seule chanson simulée
    const response = await fetch('http://localhost:3000/api/playlists/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cookies: 'test_cookies',
        targetFolderId: null,
        maxConcurrent: 1,
        testMode: true, // Mode test
        testSong: testSong
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Réponse de l\'API:', data);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.log('💡 Assurez-vous que votre application est démarrée sur localhost:3000');
  }
}

// Alternative: test direct du service
async function testDirectImport() {
  try {
    console.log('🔧 Test direct du service songService...');
    
    // Import dynamique du module (nécessite que l'app soit en cours d'exécution)
    const { songService } = await import('./src/lib/services/songService.js');
    
    // Test de création d'une chanson
    const newSongData = {
      title: testSong.title,
      author: testSong.author,
      content: testSong.content,
      folderId: null
    };
    
    console.log('📥 Création de la chanson...');
    const createdSong = await songService.createSong(newSongData);
    console.log('✅ Chanson créée avec succès:', {
      id: createdSong.id,
      title: createdSong.title,
      author: createdSong.author
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du test direct:', error.message);
    console.log('💡 Ce test nécessite que l\'application Next.js soit en cours d\'exécution');
  }
}

// Exécuter les tests
console.log('🚀 Démarrage des tests...\n');

// Test 1: API endpoint
testSupabaseImport().then(() => {
  console.log('\n' + '='.repeat(50));
  
  // Test 2: Service direct
  return testDirectImport();
}).then(() => {
  console.log('\n🎉 Tests terminés !');
}).catch(error => {
  console.error('\n💥 Erreur lors des tests:', error);
});
