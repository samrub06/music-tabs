const cheerio = require('cheerio');

// Test avec une URL réelle de vos logs
const testUrl = 'https://tabs.ultimate-guitar.com/tab/alexander-jean/whiskey-and-morphine-chords-2211995';

async function debugScraper() {
  try {
    console.log('🔍 Testing scraper with URL:', testUrl);
    
    const response = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status);
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Vérifier si .js-store existe
    const jsStore = $('.js-store');
    console.log('📦 Found .js-store elements:', jsStore.length);
    
    if (jsStore.length > 0) {
      const dataContent = jsStore.attr('data-content');
      console.log('📄 Data-content length:', dataContent ? dataContent.length : 'null');
      
      if (dataContent) {
        try {
          const decodedData = dataContent
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
          
          const data = JSON.parse(decodedData);
          console.log('✅ JSON parsed successfully');
          
          // Explorer la structure
          console.log('🔍 Data structure:');
          console.log('- data.store exists:', !!data.store);
          console.log('- data.store.page exists:', !!data.store?.page);
          console.log('- data.store.page.data exists:', !!data.store?.page?.data);
          console.log('- data.store.page.data.tab_view exists:', !!data.store?.page?.data?.tab_view);
          console.log('- data.store.page.data.tab_view.meta exists:', !!data.store?.page?.data?.tab_view?.meta);
          
          if (data.store?.page?.data?.tab_view?.meta) {
            const meta = data.store.page.data.tab_view.meta;
            console.log('🎵 Meta data:');
            console.log('- title:', meta.title);
            console.log('- artist:', meta.artist);
          }
          
          if (data.store?.page?.data?.tab_view?.wiki_tab) {
            const wikiTab = data.store.page.data.tab_view.wiki_tab;
            console.log('📝 Wiki tab exists:', !!wikiTab);
            console.log('- content length:', wikiTab.content ? wikiTab.content.length : 'null');
          }
          
          // Explorer toutes les clés disponibles
          console.log('🔑 All available keys in data.store.page.data:');
          if (data.store?.page?.data) {
            Object.keys(data.store.page.data).forEach(key => {
              console.log(`  - ${key}`);
            });
          }
          
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugScraper();
